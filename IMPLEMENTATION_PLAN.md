# PupputGate — Implementation Plan

_Last updated: 2026-10-17_

PupputGate is a native iOS/Android marketplace for local commerce in Hammamet,
Tunisia. It connects customers with local businesses across four commerce modes —
**Appointments, Orders, Showcase (artisan reservations), and Quotes (home
services)** — with discovery, maps, booking, stock, and merchant/admin tooling.

This document records the build phases, architecture, verified dependency
versions, risks, and acceptance criteria.

---

## 1. Environment audit (Stage 1 findings)

| Item | Finding |
|---|---|
| Target repo | `C:\Users\ammarkefi\Documents\PupputGate` — **empty**. Greenfield build, nothing to preserve. |
| Dev machine | Windows x64, Node 20 present in home dir, Expo/`.expo`/`.bun` tooling present. |
| **Node requirement** | **SDK 57 needs Node ≥ 22.13.** The Node 20 in the home dir is too old for the Expo CLI — upgrade Node before running. |
| Run target | **Expo Go** on a physical device (user's choice). This constrains us to SDK 57's prebuilt native modules — **no custom native code / no custom dev build required**. |
| Build/verify sandbox | The assistant's cloud sandbox has Node 22 + PostgreSQL 16 but **no access to the npm registry** (egress policy blocked it during this build). Therefore installs, Metro bundling, type-checks, and tests were **authored but not executed in the sandbox**; they run on your machine. See "Verification status" at the end. |

### Expo Go consequences (important)
- Everything uses modules bundled in the Expo Go client for SDK 57. No library
  that needs a custom dev build is used.
- `react-native-maps` **renders inside Expo Go** using Expo Go's own bundled
  Google Maps key on Android. Your personal API key only takes effect in a
  development/production build (`npx expo run:android` / EAS). This is documented
  and handled with a graceful fallback — see `DESIGN_DECISIONS.md` §Maps.

---

## 2. Verified dependency versions (Expo SDK 57 manifest)

Pinned from Expo's published `bundledNativeModules.json` for `sdk-57` so
`npm install` resolves a compatible, Expo-Go-safe tree.

**Core:** `expo ~57.0.0`, `react 19.2.3`, `react-dom 19.2.3`,
`react-native 0.86.3`, `typescript ~5.9`, `@types/react ~19.2`.

**Navigation / UI:** `expo-router ~57.0.28`, `react-native-screens ~4.26.0`,
`react-native-safe-area-context ~5.7.0`, `@expo/vector-icons ^15.0.2` (Ionicons),
`react-native-svg 15.15.4`, `expo-image ~57.0.5`, `expo-blur ~57.0.3`
(Liquid-Glass approximation), `expo-status-bar`, `expo-system-ui`.

**Motion:** `react-native-reanimated ~4.5.1` + `react-native-worklets 0.10.1`
(Reanimated 4 requires the worklets package + babel plugin),
`react-native-gesture-handler ~2.32.0`.

**Platform:** `react-native-maps 1.27.2`, `expo-location ~57.0.21`,
`expo-haptics ~57.0.3`, `expo-secure-store ~57.0.4`,
`@react-native-async-storage/async-storage 2.2.0`, `expo-localization ~57.0.2`,
`expo-linking`, `expo-constants`, `expo-image-picker ~57.0.20`,
`@react-native-community/datetimepicker 9.1.0`.

**Backend:** Node + Express 5, Prisma 6, PostgreSQL, Zod, bcrypt, helmet,
express-rate-limit, Jest + Supertest for tests.

---

## 3. Architecture

```
PupputGate/
  app/            Expo Router routes & layouts (auth gateway, tabs, flows)
  components/     Reusable presentation components (design-system primitives)
  features/       Business-specific feature modules (booking, orders, quotes…)
  hooks/          Reusable hooks (useAuth, useBusinesses, useDebounce…)
  services/       API client + typed endpoint wrappers
  lib/            config, formatting (money/date), validation, query helpers
  locales/        fr-TN (default), en, ar — central dictionaries
  theme/          design tokens, typography, spacing, radii
  types/          shared mobile-side types (mirror server contracts)
  server/         Express API, services, middleware, tests
  prisma/         schema.prisma + deterministic seed
```

**Client data model:** a central typed API client (`services/api.ts`) with
opaque bearer tokens stored in `expo-secure-store`. A lightweight query layer
(`lib/query.ts` — a small fetch+cache+poll hook, no heavy dependency) gives every
data screen a consistent `{ loading, error, data, refetch }` shape, plus a
10–20s poll for the demo (labelled honestly).

**Auth flow:** `expo-router` root layout checks a restored session → routes
signed-out users to `/welcome` (role selection), signed-in users to the tabs.
Role is read from the backend after login — never selectable client-side as a
privilege.

**State:** React context for auth + locale; server state via the query hook. No
Redux — unnecessary for this scope.

---

## 4. Build phases

1. **Scaffold + docs + tokens** — config, planning docs, design system, i18n.
2. **Backend** — Prisma schema, auth (bcrypt + opaque tokens), Zod validation,
   helmet, rate limiting, role/ownership middleware, deterministic seed.
3. **Auth + navigation (mobile)** — welcome/role select, login, register,
   secure session restore, 5-tab shell with role-based Activity.
4. **Discovery + maps** — home, explore (filters/zones/debounced search),
   business cards, storefronts per mode, `react-native-maps` + fallback.
5. **Commerce flows** — appointments (slot generation + transactional booking),
   orders (stock rules), showcase (unique-piece reservation), quotes
   (request → quotation → accept). Transactions enforced server-side.
6. **Merchant + admin** — dashboard with one-tap ops, onboarding, admin approval/
   moderation with server authorization.
7. **Quality** — tests, type/lint, RTL pass, state coverage, refinement.
8. **Delivery** — docs + honest final report.

---

## 5. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Maps need a dev build for the personal key | Expo Go renders maps with its own key; personal key documented for dev builds; list-based fallback if maps unavailable. |
| Node 20 on dev machine too old | README flags Node ≥ 22.13 up front. |
| Postgres setup friction on Windows | `docker-compose.yml` for one-command Postgres + native-install notes. |
| Physical-device API connectivity | API base URL auto-derives the dev-machine LAN IP from Expo's packager host; override via `EXPO_PUBLIC_API_URL`. |
| Double-booking / overselling | Serializable DB transactions + unique constraints; integration tests on Postgres. |
| Sandbox could not run installs/tests | All code authored for correctness; test suite shipped to run on your machine; verification status documented honestly. |

---

## 6. Acceptance criteria (per the brief)

- New/signed-out users see the auth gateway with explicit Client/Commerçant
  selection first; sessions restore on relaunch.
- All four commerce modes have working core journeys backed by the real API.
- Slot availability, stock, and unique-item reservation are enforced on the
  server with transactions and covered by tests.
- Admin operations authorized server-side; role cannot be elevated from the client.
- fr/en/ar with correct RTL on the implemented screens.
- Maps render with real coordinates and a documented provider + fallback.
- No fake payments, no fake SMS delivery, no fabricated "tests passed" claims.
