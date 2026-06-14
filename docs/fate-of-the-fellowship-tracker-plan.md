# Fate of the Fellowship Tracker TDD Plan

Build `/fate-of-the-fellowship/` as a sibling to `/nemesis/`: same website repo, same YAML-driven publishing model, same test discipline, but with a warm inn-ledger or Shire noticeboard visual identity.

## TDD rule

Each implementation phase should start with the narrowest failing test that describes the next behavior or contract. Implementation follows only far enough to turn that test green, then cleanup/refactor stays within that phase's scope.

When a phase depends on missing physical card text, encode the pending boundary explicitly instead of inventing values. Tests should enforce that pending state until the real card text is available.

Do not push tracker work until the active phase is green and reviewed locally.

## Current status

Phases 1 through 8 are complete locally. Final verification is green. The page is exposed in the header More dropdown as `LOTR: FotF`, while footer navigation remains unchanged. Do not push until the user explicitly asks.

Completed local contracts:

- `content/fate-of-the-fellowship/_index.md` exists and publishes through a custom tracker layout
- `data/fate-of-the-fellowship/heroes.yaml` contains the locked hero names and stable keys
- `data/fate-of-the-fellowship/objectives.yaml` contains the locked objective names, stable keys, and marks `Destroy the One Ring` as required
- `data/fate-of-the-fellowship/sessions/.gitkeep` exists, and the real June 10 and June 12 session YAML files validate against the live session contract
- `docs/fate-of-the-fellowship-tracker.md` documents the data shape and uses a valid sample session
- `layouts/fate-of-the-fellowship/list.html` renders the first tracker shell, empty-state session log, populated session log, card-value lists, and add-entry actions
- `layouts/fate-of-the-fellowship/list.html` renders journey wins, tie-aware winningest hero/objective stats, hero usage with wins, objective attempts/successes, and reverse chronological session cards when sessions exist
- `layouts/fate-of-the-fellowship/list.html` renders optional final board-state photos with thumbnail buttons and a lightbox dialog
- `static/images/fate-of-the-fellowship/session-photos/.gitkeep` tracks the future Fate photo directory
- `static/css/custom.css` includes a scoped visual treatment for the Fate page with parchment panels, quest slips, green win badges, red loss badges, pinned-photo treatment, responsive grids, and a custom inn-ledger visual treatment
- `tests/fate-of-the-fellowship-tracker.test.js` enforces the scaffold, locked card values, required Ring objective, valid docs sample, real session YAML validation, rendered tracker shell, empty-state rendering, populated aggregate rendering with temporary fixture sessions, image path/dimension/file-size/format validation with a temporary fixture image, rendered thumbnail/lightbox markup, scoped visual CSS hooks, desktop/mobile browser render checks, mobile overflow checks, and this TDD plan contract
- `npm run test:fate` is wired into `npm test`
- `layouts/partials/header.html` and `layouts/partials/footer.html` intentionally do not expose the tracker yet; reserve `LOTR: FotF` for the More dropdown when the page is ready to launch
- `README.md` documents the tracker, logging guide, and `npm run test:fate`
- `docs/fate-of-the-fellowship-tracker.md` links back to this implementation plan

The content page moved out of draft in Phase 3 only after the custom layout existed, so the default Hugo list template never published a placeholder page.

## Phase 1: Scaffold contract

### Red

Add or update `tests/fate-of-the-fellowship-tracker.test.js` so it fails unless the Phase 1 scaffold exists:

- content file exists
- front matter title is `Fate of the Fellowship`
- front matter description frames the page as an inn ledger
- front matter has `draft: true`
- hero metadata exists as an object with an empty `items` array
- objective metadata exists as an object with an empty `items` array
- sessions directory exists, is tracked, and contains no sample YAML
- logging guide includes the planned session keys
- plan doc includes the TDD rule, `LOTR: FotF`, and `Fate of the Fellowship`

### Green

Create only the files needed to satisfy that scaffold:

- `content/fate-of-the-fellowship/_index.md`
- `data/fate-of-the-fellowship/heroes.yaml`
- `data/fate-of-the-fellowship/objectives.yaml`
- `data/fate-of-the-fellowship/sessions/.gitkeep`
- `docs/fate-of-the-fellowship-tracker.md`
- `tests/fate-of-the-fellowship-tracker.test.js`

Wire the test:

```json
"test:fate": "node tests/fate-of-the-fellowship-tracker.test.js"
```

### Refactor

Keep names and paths stable. Do not add a layout, nav link, real session, image optimizer, or hard-coded card text in this phase.

### Done

Run:

```bash
npm run test:fate
npm run build
npm run test:content
npm test
```

Also verify `public/fate-of-the-fellowship/index.html` is not generated while the page is still draft-only.

## Phase 2: Card text and strict data validation

### Red

After the physical card names are transcribed, extend `tests/fate-of-the-fellowship-tracker.test.js` so it fails unless:

- every hero metadata item has a stable lowercase hyphenated `key`
- every hero metadata item has a non-empty exact printed `name`
- every objective metadata item has a stable lowercase hyphenated `key`
- every objective metadata item has a non-empty exact printed `name`
- duplicate hero keys or names fail
- duplicate objective keys or names fail
- session `heroes` values must match known hero names
- session `objectives` values must match known objective names
- `result` is only `win` or `loss`
- `players` is only `1`, `2`, `3`, `4`, or `5`
- `date` uses `YYYY-MM-DD`
- filename matches `YYYY-MM-DD-result.yaml`
- no sample sessions are required unless real play data exists

### Green

Populate:

- `data/fate-of-the-fellowship/heroes.yaml`
- `data/fate-of-the-fellowship/objectives.yaml`

Update `docs/fate-of-the-fellowship-tracker.md` with the exact allowed values.

### Refactor

Keep validation helpers small and specific. If the Fate test starts duplicating a lot of Nemesis test code, extract only the minimum shared helper after both tests are green.

### Done

Run:

```bash
npm run test:fate
npm test
```

## Phase 3: First rendered tracker layout

### Red

Extend `tests/fate-of-the-fellowship-tracker.test.js` so it fails unless the built page:

- renders `/fate-of-the-fellowship/`
- uses H1 `Fate of the Fellowship`
- does not show the default Hugo `Coming Soon` section markup
- shows an empty-state session log when no sessions exist
- includes page-specific tracker shell classes
- includes sections for overview, fellowship record, quest record, session log, and add-entry actions

### Green

Create `layouts/fate-of-the-fellowship/list.html` and move the content page out of draft only when the custom layout satisfies the rendered-page tests.

Planned sections:

- overview cards: journeys logged, victories, defeats, win rate
- fellowship record: hero usage totals
- quest record: objective usage and success counts
- session log: reverse chronological entries
- action area: `Add a tale to the ledger`, with a GitHub prefilled YAML link and logging guide

### Refactor

Reuse Nemesis concepts where they reduce risk: session sorting, optional photos, note display, and lightbox shape. Do not copy Nemesis terminal language or markup wholesale.

### Done

Run:

```bash
npm run build
npm run test:fate
npm test
```

## Phase 4: Aggregate behavior

### Red

Add fixture or real session data and make tests fail unless rendered output includes:

- total journeys
- victories
- defeats
- win rate
- player-count split
- hero usage totals
- objective usage totals
- objective success counts where relevant
- reverse chronological session ordering
- each session's date, result, players, heroes, objectives, and note

### Green

Implement only the aggregation and rendering needed for those assertions.

### Refactor

Keep the Hugo template readable. If a scratch-map block becomes hard to follow, extract small partials after tests pass.

### Done

Run:

```bash
npm run build
npm run test:fate
npm test
```

## Phase 5: Images and lightbox

### Red

Extend tests so image behavior fails unless:

- optional `final_state_image` paths start with `/`
- referenced images exist
- referenced images meet the selected size and file-size contract
- rendered sessions with images include a thumbnail button
- rendered thumbnails include a lightbox source attribute
- the dialog markup exists

### Green

Create:

- `static/images/fate-of-the-fellowship/session-photos/`
- optional `scripts/optimize-fate-photos.js`

Default image contract:

- `2400x1350`
- progressive JPEG
- maximum file size enforced by tests

### Refactor

Only generalize the Nemesis photo optimizer if both games can share it without obscuring the per-game directories and error messages.

### Done

Run:

```bash
npm run build
npm run test:fate
npm test
```

Then browser-check one image lightbox manually.

## Phase 6: Visual design

### Red

Add static CSS and browser assertions that fail unless:

- styles are scoped under `body.page-fate-of-the-fellowship`
- layout has responsive breakpoints for the tracker grids
- key visual hooks exist for parchment panels, quest tags, result seals, and photo thumbnails
- desktop and mobile screenshots are nonblank
- mobile has no horizontal overflow

### Green

Add the dedicated CSS block in `static/css/custom.css`.

Design direction:

- dark timber or tavern-wall background
- parchment panels and pinned notes
- brass, ink, forest green, oxblood, charcoal, and warm brown accents
- wax-seal style win/loss badges
- objective names rendered as quest slips or small parchment tags
- photo thumbnails styled like field sketches, tucked evidence, or pinned sightings
- a small return link styled as an inn sign or ledger mark

Do not visually copy the Nemesis terminal. Reuse the machinery, not the sci-fi surface.

### Refactor

Trim decorative CSS if it harms legibility, mobile layout, or test stability.

### Done

Run:

```bash
npm run build
npm run test:fate
npm run test:mobile
npm test
```

Browser-check desktop and mobile.

## Phase 7: Navigation and docs integration

### Red

Extend existing nav/footer/content tests so they fail unless:

- the More dropdown and footer do not expose `/fate-of-the-fellowship/` before launch
- the reserved launch label is documented as `LOTR: FotF`
- README mentions the tracker and logging guide
- `docs/fate-of-the-fellowship-tracker.md` links back to the implementation plan

### Green

Keep public page links withheld until launch, and document the tracker where appropriate:

- `layouts/partials/header.html`
- `layouts/partials/footer.html`
- `README.md`
- `docs/fate-of-the-fellowship-tracker.md`

Use this short nav label:

`LOTR: FotF`

URL:

`/fate-of-the-fellowship/`

H1:

`Fate of the Fellowship`

### Refactor

Keep dropdown ordering compatible with the existing alphabetical navigation test, or update the test if the desired order is intentionally different.

### Done

Run:

```bash
npm run build
npm run test:content
npm run test:fate
npm test
```

## Phase 8: Final verification

### Red

No new implementation should start here. This phase exists to catch integration issues before publish.

### Green

Run the full local verification:

```bash
npm run build
npm run test:fate
npm test
```

Browser-check:

- desktop first viewport
- mobile first viewport
- no horizontal overflow
- long hero names wrap cleanly
- long objective names wrap cleanly
- empty-state rendering
- populated-state rendering if real sessions exist
- session photo lightbox opens and closes

### Done

Final verification is complete locally:

- `npm run build`
- `npm run test:fate`
- `npm test`

Only after the active phase and final verification are green should the work be committed. Do not push until the user explicitly asks.

## Open decisions

- Whether the introductory/default objective set should be marked in metadata
- Whether objectives have categories, difficulty markers, or setup labels worth tracking
