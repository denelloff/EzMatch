# eZ-Match Design System

Design system for **eZ-Match** — a self-hosted control panel for Counter-Strike 2
servers and matches. It manages game servers ("agents"), CS2 instances, teams,
matches (draft → warmup → knife → live → overtime → finished), live scoreboards,
demos and player statistics. Two audiences share one app: **players/viewers**
(match list, scoreboard, statistics) and **admins/owners** (a second shell with a
sidebar for servers, teams, seasons, users and settings). The product is fully
bilingual, **English + Russian**, with the toggle visible on every screen
including login.

## Sources

- Codebase (mounted, read-only): `EzMatch-panel-main/` — pnpm monorepo,
  `apps/panel` (Next.js 15 App Router + Tailwind v4), `packages/db` (Prisma),
  `packages/protocol`. Repo name in code: `github.com/denelloff/EzMatch`,
  workspace packages `@ppanel/panel`, `@ppanel/db`, `@ppanel/protocol`.
- Key files read: `apps/panel/src/app/globals.css` (theme block, direction "Steel"),
  `src/components/ui.tsx` (primitives), `src/components/ezmatch-logo.tsx`,
  `admin-sidebar.tsx`, `match-table.tsx`, `event-feed.tsx`, `nav-menu.tsx`,
  `src/app/(app)/**`, `src/app/admin/**`, `src/lib/i18n/dictionaries.ts` (all copy),
  `src/lib/match-state.ts`, `src/lib/maps.ts`, `src/lib/teams/logo.ts`.
- No Figma file, no slide deck, no brand book was provided.

**This system is not a 1:1 copy of the shipping UI.** The brief was that the
current design is unsatisfying, so the tokens describe a new direction —
**Ignite** — while every component, screen and copy string stays faithful to the
real product. The shipping design is preserved as the `[data-theme="steel"]`
scope so the two can be compared side by side.

---

## Directions

| Direction | Accent | Feel | Status |
| --- | --- | --- | --- |
| **Ignite** (default, `:root`) | `#ff6a1f` orange on `#0b0c0e` carbon | Machined, high-contrast, esports-broadcast. Angular display face, 5–10px radii, notched primary actions. | **LOCKED — the canonical direction** |
| **Nitro** (`[data-theme="nitro"]`) | `#c3f53c` lime on blue-black | Softer, rounder (12–20px radii), modern SaaS-gaming. | Rejected alternate, kept for comparison |
| **Terminal** (`[data-theme="terminal"]`) | `#3ddc84` phosphor green | Zero radius, mono everywhere, operator console. | Rejected alternate, kept for comparison |
| **Steel** (`[data-theme="steel"]`) | `#6ea8d8` blue | What ships today. | Reference only |

**The notch.** Ignite's one signature shape: a 9px cut on the top-right corner
(`--clip-notch`, 6px at `sm`). It appears on primary buttons only — which are
also uppercase in the display face — plus a 2px brand keyline before every card
header title. Do not spray it on cards, inputs or badges; its value is that it
marks exactly one thing (the committing action) and nothing else.

Switch by putting the attribute on any ancestor: `<body data-theme="nitro">`.
See the "Direction options" card under **Brand**.

## Logo

The repo ships one mark: an inline SVG "eZ" glyph in a rounded square with a
blue gradient (`components/ezmatch-logo.tsx`), preserved at
`assets/logo-legacy-steel.svg`.

**Locked mark: Reticle** — `assets/logo-reticle.svg`, also written to
`assets/logo.svg` and the default of the `Logo` component. A crosshair ring with
a solid Z inside; the four tick marks read at 22px and the ring survives being
punched out on a light surface.

Rejected alternates, kept in `assets/` for reference only — do not use them in
new work: `logo-shard.svg`, `logo-bracket.svg`, `logo-caret.svg`.

Wordmark is always **eZ-Match** — lowercase e, capital Z, hyphen, capital M — in
the display face.

---

## CONTENT FUNDAMENTALS

Copy lives in `src/lib/i18n/dictionaries.ts` (EN + RU, ~460 keys each). Rules
observed there:

- **Voice: terse operator English.** Sentence case everywhere. No exclamation
  marks, no marketing adjectives, no emoji anywhere in the product.
- **Second person, implied.** Copy addresses the admin as "you" only when giving
  an instruction: *"Start a match from an instance and it shows up here while it
  is live."* Never "I", never "we", never "Let's".
- **Descriptions state scope, not benefit.** Page subtitles say what is on the
  page: *"Everything currently held on a server, plus matches created but not
  started yet."* / *"Totals across every match this panel has run."*
- **Hints teach the game, not the UI.** Field hints carry CS2 domain knowledge:
  *"MR12 = 24 total rounds (12 per half)."* / *"Seconds before each LIVE round
  (Valve competitive = 15)."* / *"Scoreboard tag, e.g. NAVI."*
- **Empty states are two lines**: a flat title (*"Nothing running"*, *"No matches
  yet"*) plus the next action (*"Create a match from a running instance to see it
  listed here."*). Never apologise.
- **Errors are one sentence, full stop, no blame**: *"Invalid email or password."*
  / *"This server already has an open match. Finish or cancel it first."*
- **Buttons are bare verbs**: Start, Open, Edit, Delete, Restart, Duplicate,
  Save changes, Create match, Copy connect, Sign in, Sign out.
- **Domain terms are never softened**: knife round, freezetime, MR, overtime,
  GOTV delay, tech pause, `sv_password`, instance, agent, demo.
- **Casing**: nav labels and headings are sentence case ("Matches in progress",
  "Team management"); only role tags (OWNER/ADMIN), side labels (CT/T) and
  section eyebrows are uppercase. Match states use the eBot phase wording:
  Not started, Warmup, Knife round, Side decision, Live, Paused, Halftime,
  Overtime, Finished, Cancelled.
- **Numbers**: scores are zero-padded to two digits (`10 - 08`), ids are prefixed
  with `#` and set in mono, all numerals are tabular.
- **Russian** is a full translation, not a fallback — keep strings short enough
  that RU (typically 15–25% longer) still fits the same control.

## VISUAL FOUNDATIONS

**Colour.** Dark-only (`color-scheme: dark`); there is no light mode and none is
planned. Nine-step ink ramp for surfaces and text, one brand ramp, four status
colours, and two untouchable CS2 side colours (CT `#4aa8ff`, T `#f0a92c`) — side
colours mirror the game and must never be re-mapped to brand. Status colour is
semantic only: green = live, amber = transitional (warmup/knife/pause/halftime),
red = cancelled/failed, neutral grey = draft/finished.

**Type.** Two families plus mono. Display **Chakra Petch** (600/700, locked — it
replaces Manrope) for the
wordmark, page titles, scores, stat values and 10px uppercase eyebrows; body
**IBM Plex Sans** (400/500/600) for everything else; **IBM Plex Mono** for
console output, event logs, ids, steam ids and connect strings. The scale is
dense — 14px is the workhorse, 13px labels, 12px hints, 10px eyebrows, 36px
scores. Tracking: `-0.01em` on display headings, `+0.16em` on eyebrows,
`+0.25em` on the "vs" divider and side labels.

**Spacing & layout.** 2px base step; 6 / 8 / 12 / 16 / 20 / 24 do most of the
work. Fixed shell dimensions: 240px sidebar, 56px header, 1280px content max,
1024px on match pages, 36px controls, 38px table rows, 20px card padding. The
top bar is sticky (`z-index 30`) with a blurred translucent background; the admin
sidebar is fixed-width and scrolls its own nav.

**Backgrounds.** No photography, no illustration, no pattern, no texture, no
noise. The page carries one fixed radial wash (`--wash-app`) — a faint brand
glow top-left and a cooler one top-right, both under 10% alpha. The sidebar and
the login card repeat that glow at small scale. Never a full-bleed gradient
across a card.

**Cards.** 1px `--border-1` hairline, `--surface-card` fill, 14px radius, no
shadow. Header is a bordered strip with a 14px semibold title and a 12px faint
description, optional right-aligned action. Elevation is expressed as a border
plus a surface step (950 → 900 → 850 → 800), not as a shadow; shadows exist as
tokens but are reserved for overlays.

**Borders & radii.** Radii are machined: 3 / 5 / 7 / 10 / 14 / 18 / pill. Ignite
is squarer than the shipping Steel theme on purpose. Table rows are divided by
`--ink-800` hairlines, chrome by `--ink-700`.

**Transparency & blur.** Used in exactly two places: sticky chrome (header,
sidebar) at ~70–78% surface with a 12px backdrop blur, and status washes
(8–15% alpha fills behind badges and side headers). Never on cards, never on
text backgrounds.

**Hover.** Rows and nav items step up one surface (`transparent → --surface-2 →
--surface-3`); links and chips shift to the brand colour; buttons darken
(`--brand-500 → --brand-600`). Opacity is never used to express hover.

**Press & focus.** Press repeats the hover colour — nothing scales, nothing
bounces. Focus is a brand-coloured border plus a 3px `--ring-focus` glow; the
browser's default outline is always replaced, never removed without a
replacement.

**Disabled.** `opacity: .6` plus `cursor: not-allowed`, colours unchanged.

**Motion.** Two durations (160ms colour, 200ms chrome), one entry animation
(`.ezmatch-enter`: 6px fade-up over 320ms, applied to `<main>` on every route),
one loop (live dot pulse, 1.6s). Easing is `cubic-bezier(.22,.8,.36,1)`. No
parallax, no skeleton shimmer, no page transitions, no bounce. Reduced-motion
disables both animations.

**Imagery.** The only images in the product are team badges — uploaded org logos
(PNG/JPEG/WebP/GIF/SVG, 2 MB max) or a generated coloured tag badge when none
exists. They render 20–40px, `object-fit: contain`, no crop, no ring. There is no
photography anywhere and none should be introduced.

## ICONOGRAPHY

The panel is **almost icon-free by design** — an intentional trait, not a gap.

- No icon font, no sprite sheet, no icon library is installed (`package.json` has
  no lucide/heroicons/react-icons dependency).
- The only glyphs in the entire codebase are three hand-written inline SVGs:
  a select chevron and a checkbox tick (both embedded as `data:` URLs in
  `globals.css` because inline SVG cannot read theme variables), and the same
  chevron inside `nav-menu.tsx`. Both are reproduced as data URLs inside
  `Select.jsx` / `Checkbox.jsx` here.
- Meaning is carried by **text and colour**, not by icons: match state is a
  worded Badge, live is a pulsing dot, category filters are worded pills.
- **Unicode is used as punctuation, not decoration**: `·` between server and
  instance, `→` in "Display all matches →" and event actor→target, `←` on back
  links, `—` for empty values, `…` in "Waiting for players…".
- **No emoji, ever** — none appear in either dictionary.
- If a genuinely new icon need appears, use **Lucide** at 1.5px stroke, 16px, via
  CDN, and add it here first. Do not hand-draw SVGs into screens.

---

## Index

**Root**
- `styles.css` — the only file consumers link; `@import`s everything below.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent-Skills entry point.

**`tokens/`** — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`,
`effects.css`, `motion.css`, `themes.css` (nitro / terminal / steel), `base.css`.

**`assets/`** — `logo.svg` (= shard), `logo-shard.svg`, `logo-bracket.svg`,
`logo-reticle.svg`, `logo-caret.svg`, `logo-wordmark.svg`,
`logo-legacy-steel.svg`, `teams/*.png` (8 org badges copied from the repo) and
`teams/team-generated-badge.svg`.

**`components/`**
- `core/` — **Button**, **Chip**, **Badge**, **Card** (+ **CardHeader**, **CardBody**), **Notice**, **EmptyState**
- `forms/` — **Field**, **Input**, **Select**, **Checkbox**
- `brand/` — **Logo**
- `navigation/` — **TopNav** (+ **NavLink**), **Sidebar**, **LanguageToggle**
- `match/` — **MatchTable**, **Scoreboard**, **StatTile**, **EventFeed**, **TaskProgress**

Every component mirrors something the source defines (`components/ui.tsx`,
`match-table.tsx`, `scoreboard-view.tsx`, `event-feed.tsx`, `admin-sidebar.tsx`,
`nav-menu.tsx`, `ezmatch-logo.tsx`, `task-progress.tsx`, the `Stat` cell in
`stats/page.tsx`).

**Intentional additions**
- `TopNav` — the source builds its header inline in `(app)/layout.tsx`; extracted
  so screens can compose it.
- `StatTile` — the source's local `Stat` helper, promoted to a shared primitive.
- `Card.CardBody` — the source pads bodies ad hoc; codified for consistency.

**`guidelines/`** — 18 specimen cards (Colors, Type, Spacing, Brand), including
"Direction options" and "Logo marks".

**`ui_kits/panel/`** — click-through recreation of the panel, 12 screens: login,
matches in progress, archive, public match page, global statistics, admin home,
create a match, game servers (agents + instances), team management, users,
settings (match defaults + map pool), match control room (console, chat, round
backups, demos, connect line) and the deliberately-blank seasons page. See its
`README.md`.

**`templates/match-page/`** — starting template consuming projects can pick.

---

## Known gaps

- **Fonts are loaded from Google Fonts**, not from binaries — the repo used
  `next/font/google` and shipped no font files. If eZ-Match ever self-hosts, drop
  the `.woff2` files in `assets/fonts/` and replace `tokens/fonts.css` with real
  `@font-face` rules.
- **Manrope** (the shipping display face) is referenced only inside
  `[data-theme="steel"]` and has no `@font-face`; it falls back to IBM Plex Sans
  unless the file is supplied.
- Screens with no design in the source — match statistics, weapon stats, duels,
  heatmap, seasons — are left blank behind a "Coming soon" badge rather than
  invented.
