# Nemesis Tracker Logging

Add one YAML file per game to `data/nemesis/sessions/`.

Before you commit it:

1. Replace the filename placeholder with the real date, game, setup, board, and result
2. Replace every example value inside the file
3. Keep the keys exactly as written
4. Only use the allowed values listed below

Use this format:

```yaml
date: "2026-03-17"
game: "nemesis"
setup: "intruders"
board: "easy"
result: "win"
players: 3
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
- `note`: a short recap in plain English

Allowed values currently in the tracker:

- `game`: `nemesis`, `lockdown`
- `setup` for base `nemesis` and `lockdown`: `intruders`, `night-stalkers`, `carnomorphs`, `void-seeders`, `chytrids`
- `setup` for `nemesis` Aftermath: `aftermath-intruders`, `aftermath-night-stalkers`, `aftermath-carnomorphs`, `aftermath-void-seeders`, `aftermath-chytrids`
- `board`: `easy`, `hard`
- `result`: `win`, `loss`
- `players`: `2`, `3`, `4`
