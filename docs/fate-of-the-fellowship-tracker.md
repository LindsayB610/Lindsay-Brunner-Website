# Fate of the Fellowship Tracker Logging

Add one YAML file per game to `data/fate-of-the-fellowship/sessions/`.

Implementation phases live in [`docs/fate-of-the-fellowship-tracker-plan.md`](./fate-of-the-fellowship-tracker-plan.md).

If you add a `final_state_image`, put the optimized image in `static/images/fate-of-the-fellowship/session-photos/` before you commit it. Fate session photos use the same image contract as Nemesis: `2400x1350`, progressive JPEG, and web-friendly file size. `npm run test:fate` enforces the path, dimensions, and maximum size for any referenced image.

Before you commit it:

1. Replace the filename placeholder with the real date and result
2. Replace every example value inside the file
3. Keep the keys exactly as written
4. Use exact hero and objective names from the tracker metadata

Use this format:

```yaml
date: "2026-06-12"
result: "win"
players: 3
heroes:
  - "Frodo & Sam"
  - "Legolas"
objectives:
  - "Destroy the One Ring"
  - "Attain the Blessing of the Elves"
# final_state_image: "/images/fate-of-the-fellowship/session-photos/2026-06-12-win.jpg"
note: "Short recap of what happened."
```

For a loss, also mark every assigned objective as either completed or incomplete:

```yaml
date: "2026-06-12"
result: "loss"
players: 3
heroes:
  - "Frodo & Sam"
  - "Legolas"
objectives:
  - "Destroy the One Ring"
  - "Challenge Sauron"
completed_objectives:
  - "Challenge Sauron"
incomplete_objectives:
  - "Destroy the One Ring"
# final_state_image: "/images/fate-of-the-fellowship/session-photos/2026-06-12-loss.jpg"
note: "Short recap of what happened."
```

Use filenames like:

`YYYY-MM-DD-result.yaml`

Example:

`2026-06-12-win.yaml`

What to fill in:

- `date`: the actual play date in `YYYY-MM-DD`
- `result`: `win` or `loss`
- `players`: `1`, `2`, `3`, `4`, or `5`
- `heroes`: hero card names used in the session
- `objectives`: objective card names assigned in the session
- `completed_objectives`: required for losses; every completed objective from `objectives`
- `incomplete_objectives`: required for losses; every incomplete objective from `objectives`
- `final_state_image`: optional image path for a final board-state photo
- `note`: a short recap in plain English

Loss objective rule:

- For `result: "loss"`, every value in `objectives` must appear exactly once across `completed_objectives` and `incomplete_objectives`
- Do not include objectives in those status lists unless they were assigned in `objectives`

Required objective:

- `Destroy the One Ring`

Allowed hero values:

- `Legolas`
- `Arwen`
- `Faramir`
- `Eowyn`
- `Frodo & Sam`
- `Galadriel`
- `Gandalf`
- `Eomer`
- `Gimli`
- `Aragorn`
- `Merry & Pippin`
- `Gollum`
- `Boromir`

Allowed objective values:

- `Destroy the One Ring`
- `Bring Light to Mirkwood`
- `Hobbits Pledge Their Loyalty`
- `Ride with the Eored`
- `Free Theoden's Mind`
- `Lay Bare the Pits`
- `Unseat Denethor`
- `Oathbreakers Fulfil their Duty`
- `Shieldmaiden No Longer`
- `Arwen Unfurls the Banner`
- `Boromir Reclaims his Honor`
- `Deal with Freca's Heirs`
- `Lift Shadow from Dwarven Lands`
- `Attain the Blessing of the Elves`
- `Saruman Your Staff is Broken`
- `Avenge Balin`
- `Rangers Secure Eriador`
- `Challenge Sauron`
- `Subdue Umbar`
- `Confront the Balrog`
- `Shelob's Lair`
- `Secure the Crossing of the Anduin`
- `That Makes Six`
- `Infiltrate Minas Morgul`

Display notes planned for the tracker:

- Hero and objective records will aggregate from the session YAML files
- Session log entries will render in reverse chronological order
- Session photos will be clickable and open in a screen-sized dialog
- The page should feel like an inn ledger or Shire noticeboard, not a modern dashboard

Allowed values are locked in `data/fate-of-the-fellowship/heroes.yaml` and `data/fate-of-the-fellowship/objectives.yaml`. Tests reject misspelled hero or objective names.
