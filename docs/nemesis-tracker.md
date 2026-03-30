# Nemesis Tracker Logging

Add one YAML file per game to `data/nemesis/sessions/`.

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

Allowed values currently in the tracker:

- `game`: `nemesis`, `lockdown`
- `setup`: `intruders`, `carnomorphs`, `void-seeders`, `night-stalkers`, `chytrids`
- `board`: `easy`, `hard`
- `result`: `win`, `loss`
- `players`: `2`, `3`, `4`
