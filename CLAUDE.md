# Junior Astronaut: 30 днів на Місяці (NASA Space Apps 2026)

Browser game for kids 7–12: run a lunar base for 30 real days of space weather
(NASA DONKI, 2024-04-17 … 2024-05-16). Stack: React + Vite, plain CSS, no backend.

## Rules for every contributor (and every Claude session)
- Edit ONLY files in your own area (see Roles). Ask in team chat before touching others.
- `src/game/contracts.js` defines all shared data shapes and actions. Never rename or remove fields.
  Adding a field: agree with Tech Lead first.
- `src/App.jsx`, `src/game/config.js`, `src/game/gameEngine.js`, `src/game/reducer.js`: Tech Lead only.
- Every screen is `export default function X({ state, dispatch, t })`.
- All user-facing text goes through `t('namespace.key')` from `src/i18n` (UA + EN files). No hardcoded text.
- Use CSS variables from `src/styles/theme.css`. No new libraries without Tech Lead's OK.
- Develop a screen in isolation: `npm run dev`, open `http://localhost:5173/?screen=<name>` (uses `src/dev/mockState.js`).
- Never commit API keys. NASA key lives in `.env` (`NASA_KEY=...`).

## Roles / owned files
1. Tech Lead: `src/game/*` (except storage.js), `src/App.jsx`, `src/dev/*`, `.github/*`, `README.md`
2. Data Engineer: `scripts/*`, `src/data/days.json`
3. Content & i18n: `src/i18n/*/days.json`, `src/i18n/*/facts.json`, `src/i18n/*/sources.json`, `src/i18n/*/common.json`, `src/data/facts.json`, `src/components/Sources.jsx`
4. Decision UI: `Decision.jsx`, `Timer.jsx`, `src/i18n/*/decision.json`
5. Briefing UI: `Briefing.jsx`, `Result.jsx`, `FactCard.jsx`, `Meters.jsx`, `src/styles/*`, `src/i18n/*/briefing.json`, `src/i18n/*/result.json`
6. Progress UI: `Start.jsx`, `MissionMap.jsx`, `WeekComplete.jsx`, `Evacuation.jsx`, `Launch.jsx`, `Certificate.jsx`, `src/game/storage.js`, `src/i18n/*/progress.json`

## Git
Own branch per role (`engine`, `data`, `content`, `decision`, `briefing`, `progress`).
Small commits, PR when something works, only Tech Lead merges into `main`.
