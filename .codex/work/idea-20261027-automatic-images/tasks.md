# Task graph

01 → 02 → (03 || 04) → 05 → independent hostile reviews → fresh-agent fixes → repeated reviews → verified publication.

Only 03/04 overlap with disjoint ownership and serialized builds/package wiring. Parent controls commits and status.
- 01: Contracts and coverage; deps none
- 02: Automatic static and Christmas delivery; deps 01
- 03: React and interactive delivery; deps 02
- 04: Enforcement and runtime validation; deps 02
- 05: Development parity and integration; deps 03,04
