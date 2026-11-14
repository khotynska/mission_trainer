// Власник: Data Engineer. Перетворює сирі дані на src/data/days.json (30 днів).
// Формат кожного дня — див. src/game/contracts.js (розділ 1).
// TODO:
//  1. Для кожної дати 2024-04-17..2024-05-16 зібрати події FLR / CME / SEP / GST.
//  2. Головна подія за пріоритетом: SEP > EXTREME (10 травня) > CME (прибуття) > X5 > X > M > QUIET.
//  3. CME, що летять до Землі (ENLIL: isEarthGB або Earth в impactList) → cmeLaunched: [{ arrivalDay }].
//  4. Кілька записів SEP за день = одна подія.
//  5. week = ceil(day / 7), дні 29–30 → week 5. phase: дні 1–14 'day', 15–28 'night', 29–30 'day'.
//  6. Записати src/data/days.json і повідомити Tech Lead, щоб він переключив імпорт в App.jsx.
console.log('TODO: implement buildDays');
