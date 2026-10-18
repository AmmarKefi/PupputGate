# PupputGate — Design Decisions

_Last updated: 2026-10-17_

## Visual concept exploration (Stage B)

Three directions were explored for the welcome + home screens. Rather than
recolouring one idea three times, each took a genuinely different stance:

**Concept 1 — "Carte Postale" (editorial photo-led).**
A full-bleed Hammamet photograph (Medina white-and-blue, Mediterranean light)
anchors the welcome screen, with text set over a bottom scrim. Home uses a large
editorial hero with an overlapping search card. _Strength:_ strong local identity,
premium feel. _Risk:_ heavy image dependency; weak offline; text-contrast care needed.

**Concept 2 — "Souk Grid" (dense discovery-first).**
Minimal hero, immediate search, and a dense mosaic of categories/businesses.
_Strength:_ utility, fast discovery. _Risk:_ reads like a generic marketplace / app
template; fails the brief's "not a wall of colourful tiles" rule.

**Concept 3 — "Zellige" (craft-led, structured warmth). ← SELECTED**
Mediterranean craftsmanship expressed through typography, generous canvas space,
a restrained forest-green identity, and one tasteful hero photo — not gradient
soup. Categories presented as a calm editorial list with a few featured tiles,
not eleven identical squares. Commerce modes shown as four clearly-labelled
"intents" with their own accent colours. _Strength:_ distinctive, trustworthy,
native-feeling, resilient when imagery is absent. _Chosen_ because it best matches
"contemporary Mediterranean craftsmanship through refined native mobile design"
and avoids the AI-template look.

## Design tokens

Colours (from the brief) live in `theme/tokens.ts` as named tokens — no raw hex
scattered in screens. Mode accents: Appointments `#426E51`, Orders `#A8733D`,
Showcase `#936047`, Quotes `#4A7860`.

**Type scale** (system font stack; Arabic uses the platform Arabic face):
hero 34 / title 26 / section 20 / body 15 / meta 12.5 / eyebrow 11 (tracked).
Hierarchy comes from size + weight + colour, not from making everything bold or
uppercase.

**Shape:** editorial surfaces 24–28, cards 18–20, inputs/buttons 14–16, pills full.
Depth is subtle borders (`#E3E8DF`) + one soft shadow level, not heavy drop shadows.

## Liquid Glass

Applied sparingly to **one** surface class: the floating contextual status pill
and the map control bar, using `expo-blur` (`BlurView`, available in Expo Go).
Never on ordinary cards/inputs/buttons. A solid fallback colour is set underneath
so the UI stays readable where blur is unavailable or reduced.

## Navigation

Five tabs: Accueil, Explorer, Carte, Activité, Compte (labels localised). Bottom
bar is safe-area aware. The Activité destination is role-aware: customer → personal
activity; merchant → dashboard; admin → admin console. A floating status pill
appears only when an active appointment/order exists and links straight to it.

## Motion

Reanimated for: screen entrance fades/translations (~280ms), press feedback on
primary controls (~140ms), and status-change transitions. No parallax, no looping
animation, no animation that blocks an action. `prefers-reduced-motion` respected
via `AccessibilityInfo`.

## Maps (provider honesty)

- In **Expo Go**, `react-native-maps` uses **Expo Go's bundled Google key** on
  Android; iOS uses Apple Maps unless a Google-configured dev build is made.
- The provided personal key is wired into `app.config.ts`
  (`androidGoogleMapsApiKey`) and `.env.example`, taking effect only in a dev/prod
  build. It is **never hardcoded in source** and is git-ignored.
- If the map provider fails or a key is missing, the Carte screen degrades to a
  **business list + zone selector + per-business location + directions link** —
  the marketplace stays usable. We never show a decorative image and call it a map.

## Content & honesty rules applied

- All demo businesses/transactions are clearly labelled sample data.
- Ratings shown are seeded demo values, never presented as verified real reviews.
- The SMS/communication log is explicitly labelled "simulation" — no claim a
  message was delivered.
- No card-payment UI anywhere; deposits/advances are "payable in person".
