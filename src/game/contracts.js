/**
 * ============================================================
 *  КОНТРАКТИ / CONTRACTS
 *  Домовленість про формат даних між частинами гри.
 *  Змінює ЛИШЕ Tech Lead. Додавати поля — можна (повідомити в чаті).
 *  Перейменовувати / видаляти — НЕ можна без обговорення.
 * ============================================================
 */

/* ---------- 1. ДЕНЬ з days.json (власник: Data Engineer) ----------
{
  day: 25,                       // 1..30
  date: '2024-05-11',            // реальна дата з DONKI
  week: 4,                       // 1..4, 5 = відліт (дні 29–30)
  phase: 'night',                // 'day' | 'night'
  mainEvent: 'SEP',              // один з EVENT_TYPES нижче (найсильніша подія дня)
  detail: 'X5.8',                // показ для людей, напр. клас спалаху
  alsoToday: ['X1.5'],           // інші події дня (лише для показу)
  cmeLaunched: [{ arrivalDay: 27 }], // CME, що вилетіли сьогодні й прилетять у день N
  donkiIds: ['2024-05-11T...-SEP-001']
}
Тексти дня НЕ тут — вони в src/i18n/<lang>/days.json під ключем "day25".
*/
export const EVENT_TYPES = ['QUIET', 'M', 'X', 'X5', 'CME', 'EXTREME', 'SEP'];

/* ---------- 2. СТАН ГРИ (власник: Tech Lead) ----------
{
  screen: 'start',   // один з SCREENS нижче
  day: 1,
  battery: 5, life: 80, dose: 0, science: 0,
  patches: [],       // напр. ['energy', 'science']
  lang: 'ua',        // 'ua' | 'en'
  briefing: BRIEFING | null,
  result: RESULT | null,
  lastAllocation: { life: 1, shield: 0, science: 0 },
  weekSnapshot: {...} | null,   // стан на початок тижня (для рестарту)
  endReason: null | 'dose' | 'life',
  timerOn: false,               // «Режим командира» з таймером 90 с (Dev 4)
  lastWeekResult: null | { week: 1, passed: true, patch: 'energy' | null },  // для WeekComplete (Dev 6)
  launchReady: false            // true, якщо в день 29 віддано жетони на підготовку ракети
}
*/
export const SCREENS = [
  'start', 'map', 'briefing', 'decision', 'result', 'fact',
  'weekComplete', 'evacuation', 'launch', 'certificate', 'sources',
];

/* ---------- ALLOCATION — що відправляє Decision ----------
{ life: 1, shield: 2, science: 1, launch: 0 }
- цілі числа ≥ 0; shield ≤ 3; сума ≤ briefing.tokens
- launch: лише в день 29, значення 0 або CONFIG.launchPrepTokens (4); в інші дні 0 або відсутнє
*/

/* ---------- ВІДЛІТ (дні 29–30) ----------
День 29: якщо allocation.launch === 4 → launchReady = true. Якщо ні — день 29 повторюється.
День 30: після факту дня → екран 'launch' → LAUNCH_CHOICE:
  'now'  → доза +5 → сертифікат (або евакуація, якщо доза ≥ 100)
  'wait' → життєзабезпечення −15, доза + фон → сертифікат (або евакуація, якщо життя ≤ 0)
*/

/* ---------- 3. BRIEFING — що бачать Briefing і Decision ----------
{
  day: 25, date: '2024-05-11', week: 4, phase: 'night',
  tokens: 7,                     // скільки жетонів можна розподілити сьогодні
  comms: true,                   // false = вчора був X-спалах, немає зв'язку й прогнозу
  event: { type: 'SEP', detail: 'X5.8', donkiIds: [...] },
  warnings: [{ type: 'CME', inDays: 2 }],   // порожньо, якщо comms === false
  textKey: 'day25'               // ключ тексту дня в i18n days.json
}
*/

/* ---------- 4. RESULT — що бачить Result ----------
{
  deltas: { battery: -3, life: 0, dose: 2.5, science: 0 },
  damage: 26,                    // шкода до захисту
  protection: 0.9,               // частка захисту укриття
  explanationKey: 'shield_saved',// ключ у i18n result.json
  params: { percent: 90 }
}
*/

/* ---------- 5. ДІЇ (dispatch) — як екрани говорять з рушієм ---------- */
export const ACTIONS = {
  START_GAME: 'START_GAME',               // { type }
  OPEN_DECISION: 'OPEN_DECISION',         // { type }  briefing -> decision
  SUBMIT_ALLOCATION: 'SUBMIT_ALLOCATION', // { type, allocation: { life, shield, science } }
  NEXT: 'NEXT',                           // { type }  result -> fact -> далі
  RESTART_WEEK: 'RESTART_WEEK',           // { type }
  GO: 'GO',                               // { type, screen }  напр. 'map', 'sources'
  SET_LANG: 'SET_LANG',                   // { type, lang }
  TOGGLE_TIMER: 'TOGGLE_TIMER',           // { type }  вмикає/вимикає таймер
  LAUNCH_CHOICE: 'LAUNCH_CHOICE',         // { type, choice: 'now' | 'wait' }  лише на екрані 'launch'
};

/* ---------- 6. ПРОПСИ КОМПОНЕНТІВ ----------
Кожен екран: <Screen state={state} dispatch={dispatch} t={t} />
t(key, params) — переклад, напр. t('decision.title'), t('days.day25.text')
*/
