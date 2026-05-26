# Nemesis Tracker Logging

Add one YAML file per game to `data/nemesis/sessions/`.

Before you commit it:

1. Replace the filename placeholder with the real date, game, setup, board, and result
2. Replace every example value inside the file
3. Keep the keys exactly as written
4. Only use the allowed values listed below

If you add a `final_state_image`, put the original image in `static/images/nemesis/session-photos/` and optimize it before you commit:

```bash
npm run optimize:nemesis-photos
```

The optimizer crops every Nemesis session photo to `2400x1350` (16:9), compresses it as a progressive JPEG, and keeps the file web-friendly. `npm run test:nemesis` enforces the exact image dimensions and a maximum file size.

Use this format:

```yaml
date: "2026-03-17"
game: "nemesis"
setup: "intruders"
board: "easy"
result: "win"
players: 3
final_state_image: "/images/nemesis/session-photos/2026-03-29-nemesis-intruders-easy-loss.jpg"
note: "Short recap of what happened."
```

Use filenames like:

`YYYY-MM-DD-game-setup-board-result.yaml`

Example:

`2026-03-29-nemesis-intruders-easy-loss.yaml`

What to fill in:

- `date`: the actual play date in `YYYY-MM-DD`
- `game`: `nemesis` or `lockdown`
- `setup`: one of the exact setup keys below
- `board`: `easy` or `hard`
- `result`: `win` or `loss`
- `players`: `2`, `3`, or `4`
- `final_state_image`: optional image path for a final board-state photo
- `note`: a short recap in plain English

Display notes:

- Setup records hide unplayed setups, except base Intruders for Nemesis and Lockdown
- Session log cards show notes clamped to five lines, with a More/Less toggle for longer notes
- Session photos are clickable and open in a screen-sized dialog

Allowed values currently in the tracker:

- `game`: `nemesis`, `lockdown`
- `setup` for base `nemesis` and `lockdown`: `intruders`, `night-stalkers`, `carnomorphs`, `void-seeders`, `chytrids`
- `setup` for `nemesis` Aftermath: `aftermath-intruders`, `aftermath-night-stalkers`, `aftermath-carnomorphs`, `aftermath-void-seeders`, `aftermath-chytrids`
- `board`: `easy`, `hard`
- `result`: `win`, `loss`
- `players`: `2`, `3`, `4`
