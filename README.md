# 🌕 Junior Astronaut: 30 днів на Місяці

NASA Space Apps Challenge 2026 · Challenge: *Build a Junior Astronaut Mission Trainer*

Browser game for kids 7–12: command a lunar base for 30 real days of space weather
from NASA DONKI (2024-04-17 … 2024-05-16). Every choice has a cost.

## Quick start (team)
```bash
git checkout main && git pull
git checkout -b <your-role-branch>
npm install
npm run dev
```
- Full game: http://localhost:5173
- One screen with mock data: http://localhost:5173/?screen=decision (briefing, result, fact, map, weekComplete, evacuation, launch, certificate, sources, start)

**Read first:** `CLAUDE.md` (rules + who owns which files) and `src/game/contracts.js` (data formats).

## Data
NASA DONKI — Space Weather Database Of Notifications, Knowledge, Information (https://kauai.ccmc.gsfc.nasa.gov/DONKI/).
Events are archived (not live) and embedded in `src/data/days.json`.
