# Fate of the Fellowship Tracker Implementation Plan

Build `/fate-of-the-fellowship/` as a sibling to `/nemesis/`: same website repo, same YAML-driven publishing model, same test discipline, but with a warm inn-ledger or Shire noticeboard visual identity.

## Phase 1: Data model

Create the core content and data files:

- `content/fate-of-the-fellowship/_index.md`
- `data/fate-of-the-fellowship/heroes.yaml`
- `data/fate-of-the-fellowship/objectives.yaml`
- `data/fate-of-the-fellowship/sessions/`
- `docs/fate-of-the-fellowship-tracker.md`

Use one YAML file per session.

```yaml
date: "2026-06-12"
result: "win"
players: 3
heroes:
  - "Frodo"
  - "Sam"
objectives:
  - "Blessing of the Elves"
  - "Destroy the One Ring"
final_state_image: "/images/fate-of-the-fellowship/session-photos/example.jpg"
note: "Short recap."
```

Once the physical card text is available, hard-code strict allowed values for `heroes` and `objectives`.

## Phase 2: Page structure

Create `layouts/fate-of-the-fellowship/list.html`.

Planned sections:

- Hero or intro: `Fate of the Fellowship Ledger`
- Overview cards: journeys logged, victories, defeats, win rate
- Fellowship record: hero usage totals
- Quest record: objective usage and success counts
- Session log: reverse chronological entries
- Action area: `Add a tale to the ledger`, with a GitHub prefilled YAML link and logging guide

Reuse the Nemesis implementation pattern for aggregation, session sorting, optional photos, note display, and lightbox behavior where it fits.

## Phase 3: Visual design

Add a dedicated CSS block in `static/css/custom.css`, scoped to `body.page-fate-of-the-fellowship`.

Design direction:

- dark timber or tavern-wall background
- parchment panels and pinned notes
- brass, ink, forest green, oxblood, charcoal, and warm brown accents
- wax-seal style win/loss badges
- objective names rendered as quest slips or small parchment tags
- photo thumbnails styled like field sketches, tucked evidence, or pinned sightings
- a small return link styled as an inn sign or ledger mark

Do not visually copy the Nemesis terminal. Reuse the machinery, not the sci-fi surface.

## Phase 4: Images

Create:

- `static/images/fate-of-the-fellowship/session-photos/`
- optional optimizer script: `scripts/optimize-fate-photos.js`

Default image contract:

- `2400x1350`
- progressive JPEG
- maximum file size enforced by tests

Keep the same lightbox interaction pattern as Nemesis, but restyle the dialog and thumbnails for the inn-ledger page.

## Phase 5: Tests

Create `tests/fate-of-the-fellowship-tracker.test.js`.

Validate:

- hero metadata exists and parses
- objective metadata exists and parses
- session files parse
- filename matches session date and result
- `result` is `win` or `loss`
- `players` is `1-5`
- every listed hero is known
- every listed objective is known
- required fields exist
- image paths exist when provided
- referenced images meet the size contract
- rendered page includes aggregate counts
- rendered page includes hero, objective, and session data
- GitHub prefilled logging link contains required placeholders

Add an npm script:

```json
"test:fate": "node tests/fate-of-the-fellowship-tracker.test.js"
```

Wire `test:fate` into `npm test` once the first stable page and sample data exist.

## Phase 6: Navigation and docs

Add page links where appropriate:

- `layouts/partials/header.html`
- `layouts/partials/footer.html`
- `README.md`
- `docs/fate-of-the-fellowship-tracker.md`

Use a short nav label. Candidates:

- `Fellowship`
- `Fate`
- `Fate Ledger`

Likely URL:

`/fate-of-the-fellowship/`

Likely H1:

`Fate of the Fellowship Ledger`

## Phase 7: Build and verify

Run:

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
- session photo lightbox opens and closes
- empty-state rendering if no sessions exist

## Open decisions

- Exact hero names from the physical cards
- Exact objective names from the physical cards
- Whether the introductory/default objective set should be marked in metadata
- Whether objectives have categories, difficulty markers, or setup labels worth tracking
- Final nav label
- Whether to keep the same `2400x1350` session image contract as Nemesis or choose a different crop for the tavern-ledger design
