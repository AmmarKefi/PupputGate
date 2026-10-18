# Homepage redesign — five concepts

PupputGate is an Expo / React Native app. "The homepage" is two routes that now
render the same direction:

| Route | Audience | Notes |
| --- | --- | --- |
| `app/welcome.tsx` | guests | public entry point; header keeps sign-in, page closes with the professional CTA |
| `app/(tabs)/index.tsx` | signed-in users | redirects guests to `/welcome`; renders inside the tab bar |

Both render `HomeConcept` from `features/home/HomeConcept.tsx` with the
direction chosen in `features/home/types.ts` (`PRODUCTION_CONCEPT`). The live
Concept D was subsequently restyled to borrow the reference's bright teal hero,
white search, circular category selectors and calm white content sheet; it
keeps PupputGate's own copy, routes, colors and real business data.

## Why the old homepage was weak

- It was built from stacked default surfaces: a gradient blob, a fake search
  pill, four identical mode cards, a bordered category list, then cards. Every
  section was its own rounded container, so nothing led.
- The hero promised "Tout Hammamet, dans votre poche" without saying what you
  can actually do (book, order, ask for a quote).
- The "search" was a button dressed as a field, and it always landed on the
  unfiltered explore screen.
- The guest homepage carried a second, different hero, so the product changed
  appearance the moment you signed in.
- Repeated generic icons were the only visual identity: no photography, no
  editorial system, no local character.

## The shared foundation (`features/home/`)

- `AtelierCover` — a deterministic editorial cover (tinted ground, geometric
  motif from the slug, monogram, category icon) used everywhere a photo would
  go. The repository holds **no photography of these businesses**; using stock
  photos would imply they exist, so covers are a composed system instead.
- `BusinessTile` — one business entry with `grid` / `rail` / `row` variants, one
  aspect ratio per variant, real rating/price/next-slot only.
- `SearchField` — submits to `/explore?q=` (the server-side search).
- `HomeHeader`, `CategoryRail` / `CategoryTiles`, `ProBanner`, `MiniMap`,
  `HomeLoading` / `HomeError` / `EmptyHome`.
- `useHomeData` — one API pass (`/businesses?sort=rating`, `/categories`,
  `/zones`). Ratios and ordering are the server's; nothing is curated locally.
- `useHomeActions` — every destination lives here: `/explore`, `/business/:slug`,
  `/map`, `/login`, `/register?role=MERCHANT`, `/onboarding/business`.
- `layout.tsx` — breakpoints (`compact < 700 ≤ medium < 1024 ≤ wide`) with an
  optional width override so the preview can render the real desktop layout.
- `copy.ts` — concept-specific copy in fr / en / ar.

## The five directions

### A — La carte locale (local discovery map)

Forest hero band, real map of the businesses that have saved coordinates, a
`Carte / Liste` toggle, a category rail that filters map + rail + grid from one
set, then addresses and the professional CTA.

- **Strengths** — the most local and most differentiated; the map is real; one
  filter drives every module, so nothing disagrees.
- **Weaknesses** — map load cost and gesture conflicts on the home screen;
  depends on coordinates (13/13 seeded businesses have them, new ones may not);
  weaker on a first visit for someone who does not think in maps.
- **Feasibility** — high: reuses `react-native-maps` with the existing
  defensive loading and an honest list fallback.

### B — Une recherche, tous les besoins (one search)

Oversized search field, real suggested searches ("Commander un gâteau" →
`mode=ORDER&q=gâteau`, "Trouver un plombier" → `category=depannage`), large
category tiles, then businesses.

- **Strengths** — answers the visitor's own question first; suggestions prove
  the breadth of the catalogue; search is functional, not decorative.
- **Weaknesses** — search-first is the most competitive, least ownable idea;
  empty results are one typo away; the three transaction paths are implicit.
- **Feasibility** — high.

### C — Le magazine local (editorial)

Masthead with today's date, large asymmetric headline, one featured story,
a numbered address index with hairline rules, rule-topped "services du
quotidien", and a shop rail. No cards.

- **Strengths** — the most distinctive and the most "designed"; excellent
  typographic rhythm; makes the catalogue feel curated and local.
- **Weaknesses** — editorial emphasis favours browsing over acting; the three
  actions sit lower; harder to scan on a phone; no real photography to carry it.
- **Feasibility** — high (pure layout, no new dependencies).

### D — Trois façons d'agir (three ways) — **recommended**

Teal Hammamet header, location label, prominent white search, and circular
real-category rail, followed by a white sheet with three clear paths: Réserver
→ appointment businesses, Commander → product businesses, Trouver un pro →
quote businesses. Compact rows on phones, three columns on tablet/desktop, then
real business rails and the professional CTA. The visual language takes cues
from the supplied reference while avoiding its unrelated service imagery,
fake discounts and unconnected activity counters.

- **Strengths** — highest comprehension in three seconds; each path lands on a
  real filtered list; works identically for guests and signed-in users; reads
  well at 390 px without a giant hero.
- **Weaknesses** — a three-option hero can feel like a menu; less atmospheric
  than A or C; needs the supporting sections to avoid feeling utilitarian.
- **Feasibility** — high; no map, no imagery, no new dependencies.

### E — La place de marché premium

White page, restrained headline, search, category rail, uniform 3:2 discovery
grid, then "Commerces" and "Services" rails split by mode.

- **Strengths** — calm, consistent, obviously a marketplace; strong on tablet
  and desktop; scales as the catalogue grows.
- **Weaknesses** — closest to a generic marketplace template, exactly the risk
  the brief names; least local character; hero says less about *what you do*.
- **Feasibility** — high.

## Comparison

| Criterion | A | B | C | D | E |
| --- | --- | --- | --- | --- | --- |
| Immediate clarity of the product | 3 | 4 | 3 | **5** | 4 |
| Visual distinctiveness | **5** | 3 | **5** | 4 | 3 |
| Ease of finding a business | 3 | **5** | 4 | 4 | 5 |
| Visibility of booking / ordering / quote | 3 | 3 | 3 | **5** | 4 |
| Visibility of the professional offering | 4 | 4 | 3 | 4 | 4 |
| Mobile usability | 3 | 4 | 3 | **5** | 5 |
| Feasibility in this architecture | 4 | 5 | 5 | 5 | 5 |

(1 = weak, 5 = strong.)

**Recommendation: D.** It is the only direction where the three transactions —
the reason the product exists — are the first thing on screen, and it is the
least dependent on assets the project does not have (photography, a maps key,
a large catalogue). A is the strongest differentiator and a good candidate for
the *explore* tab, where a map already lives; C is the strongest brand piece
and could carry a marketing screen later.

## Accessing the preview

- The route is `app/design-preview.tsx`, gated to `__DEV__` (or
  `EXPO_PUBLIC_DESIGN_PREVIEW=1` for a QA build) and never linked from the app,
  so a customer can never reach it.
- Start the app (`npx expo start`) and open the route by deep link:
  - development build: `npx uri-scheme open pupputgate://design-preview --android`
  - Expo Go: `exp://<your-host>:8081/--/design-preview`, or scan
    `exp://<your-host>:8081/--/design-preview` from the device.
  The only other way in is a temporary `router.push('/design-preview')` while
  developing.
- It renders the real API data, with a concept switcher (A–E) that changes the
  composition without a reload, and device widths 390 / 768 / 1280. On widths
  wider than the device, the stage scrolls horizontally.
- Production direction is one line in `features/home/types.ts`:
  `export const PRODUCTION_CONCEPT: ConceptId = 'D';`

## Data honesty

- No invented reviews, ratings, counts, discounts, "open now" badges or
  availability. Ratings and next-slot labels come from the API.
- `EmptyHome` is shown when the API returns no businesses.
- The seeded catalogue is demo content (`isDemo` in the database); the preview
  is labelled as a development tool for that reason.

## Known limitations

- No photography: covers are generated posters, by design (see above).
- Concept A's map cannot be visually verified without a device/emulator in this
  environment; the list fallback is the guaranteed path. On the homepage the map
  keeps its pins tappable but has pan/zoom disabled so it cannot steal the
  page's vertical scroll — full navigation lives in the Map tab.
- Arabic layout is handled through `isRTL` and RTL-aware text, but the new
  screens were not visually inspected in Arabic.
