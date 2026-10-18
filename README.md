# PupputGate

A native iOS/Android marketplace for local commerce in **Hammamet, Tunisia**,
built with **Expo SDK 57 / React Native 0.86** (mobile) and **Express 5 + Prisma 6
+ PostgreSQL** (backend). Four commerce modes — **Appointments, Orders,
Showcase (artisan reservations), Quotes (home services)** — with discovery,
maps, booking, stock, a merchant dashboard and an admin console.

> Demo project. All businesses, ratings and transactions are clearly-labelled
> sample data. No online payments. No real SMS. See “Honesty & limitations”.

---

## 1. Prerequisites

- **Node.js ≥ 22.13** (Expo SDK 57 requires it — a Node 20 install is too old).
- **PostgreSQL 16** (via Docker, or a native install).
- The **Expo Go** app on your phone (iOS/Android), on the **same Wi‑Fi** as your computer.
- Optional: Docker Desktop (for the one-command database).

## 2. Install

```bash
# from the project root
npm install          # mobile app
cd server && npm install   # backend
cd ..
```

## 3. Environment setup

```bash
# backend env
cp server/.env.example server/.env   # edit AUTH_TOKEN_SECRET

# mobile env (optional – only if the API is not on your dev machine)
cp .env.example .env
```

The mobile app auto-detects the API URL from the Expo packager host (your dev
machine’s LAN IP) on port **4000**, so Expo Go on a physical device works with
no manual IP configuration. Override with `EXPO_PUBLIC_API_URL` if needed.

## 4. Database

```bash
# easiest: Docker
docker compose up -d

# OR a native Postgres: create a database and user matching server/.env
```

## 5. Migrations & seeding

```bash
cd server
npm run prisma:generate
npm run prisma:push      # create tables from schema (no migration history needed for the demo)
npm run seed             # deterministic demo data (reseedable)
cd ..
```

## 6. Run the API

```bash
cd server
npm run dev              # http://0.0.0.0:4000  (listens on your LAN)
```

Leave this running. Check `http://localhost:4000/health`.

## 7. Run the mobile app

```bash
# in the project root, in a second terminal
npm start                # opens Expo; scan the QR with Expo Go
```

The app connects to the API over your LAN automatically. If your phone can’t
reach it, set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:4000` in `.env` and
restart `npm start`.

## 8. Google Maps configuration

- In **Expo Go**, `react-native-maps` renders using **Expo Go’s own bundled
  Google key** on Android (no setup). On iOS it uses Apple Maps in Expo Go.
- Your **personal** key only takes effect in a **development/production build**.
  Put it in `.env` as `GOOGLE_MAPS_ANDROID_KEY=...` and create a dev build:
  ```bash
  npx expo run:android      # requires Android SDK; bakes the key into the build
  ```
  Required Google Cloud setup for a dev build: enable the **Maps SDK for
  Android** (and **Maps SDK for iOS** if targeting iOS) on your project, and
  enable billing. The key is **never committed** (see `.gitignore`).
- If the map provider is unavailable, the Carte screen degrades gracefully to a
  **business list + zones + directions** — the app stays usable.

## 9. Demo accounts

Shared password: **`PupputDemo2026!`**

| Email | Role |
|---|---|
| `client@pupputgate.demo` | Customer |
| `merchant@pupputgate.demo` | Merchant (barber, spa, …) |
| `pastry@pupputgate.demo` | Merchant (pastry, bakery) |
| `plumber@pupputgate.demo` | Merchant (home-service quotes) |
| `artisan@pupputgate.demo` | Merchant (Medina artisan) |
| `admin@pupputgate.demo` | Administrator |

The login screen offers one-tap **prefill** shortcuts for these (you still submit).

## 10. Test commands

Tests run against a **real Postgres test database** (the suite refuses to run
unless `DATABASE_URL` contains “test”, to protect your dev data):

```bash
cd server
# create & prepare a test DB (once)
createdb pupputgate_test   # or make one in your Postgres
DATABASE_URL="postgresql://pupput:pupput@localhost:5432/pupputgate_test?schema=public" npm run prisma:push

# run the suite
DATABASE_URL="postgresql://pupput:pupput@localhost:5432/pupputgate_test?schema=public" npm test
```

Coverage: registration/login, invalid credentials, no self-admin, suspended
users, appointment slot collisions & capacity, stock constraints, unique-piece
double-reservation, quotation accept + state transitions, role authorization,
business ownership, and private-address visibility.

Mobile checks:
```bash
npm run typecheck    # tsc --noEmit (strict mode)
npm run lint
```

## 11. Hammamet demo zones

`medina` (Médina), `centre` (Centre-ville), `yasmine` (Yasmine Hammamet),
`nord` (Hammamet Nord), `sud` (Hammamet Sud). Coordinates are approximate and
documented in `server/prisma/seed.ts`.

## 12. Honesty & limitations

- **No online payments.** Deposits/advances are recorded as amounts payable **in
  person**; no card details are ever collected.
- **No real SMS.** The merchant “communication log” is explicitly a
  **simulation** and never claims a message was delivered.
- **Photo uploads** are not implemented; the quote flow accepts validated
  **HTTPS image URLs** and is labelled as such.
- **Ratings/reviews** in the seed are sample data, labelled “démonstration”, not
  presented as verified real reviews.
- **bcrypt**: uses `bcryptjs` (pure-JS bcrypt) to avoid a native build toolchain
  on Windows — same algorithm.
- **Build verification**: this codebase was authored and version-pinned against
  the official Expo SDK 57 manifest. The assistant’s sandbox could not reach the
  npm registry, so `npm install`, Metro bundling, type-checks and the Jest suite
  were **not executed there** — run them locally (commands above). Not production-
  security-audited.

## 13. Project structure

```
app/            Expo Router routes (auth gateway, tabs, commerce flows)
components/     Design-system primitives
features/       activity / merchant / admin feature modules
hooks/          useAuth, useLocale, useQuery, useDebounce
lib/            api client, config, formatting, haptics, storage
locales/        fr (default) / en / ar dictionaries
theme/          design tokens
types/          shared client types
server/         Express API, services, middleware, tests
server/prisma/  schema + deterministic seed
```

See `IMPLEMENTATION_PLAN.md` and `DESIGN_DECISIONS.md` for the architecture and
visual direction.
