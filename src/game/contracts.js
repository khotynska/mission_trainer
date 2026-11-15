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
                                 // arrivalDay може бути більше 30 — це прибуття CME вже після відльоту (показується лише як попередження в останні дні)
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

/* ---------- 2a. НОВІ ПОЛЯ СТАНУ (логіка «причина → наслідок») ----------
  mood: 70,                      // 😊 настрій екіпажу 0–100 (нижче 30 — наука вдвічі менша)
  wall: 0,                       // 🧱 укріплення укриття 0–2 (кожен рівень −1 ☢️, коли ховаєшся)
  timerOn: true,                 // таймер у днях із бурями
  theme: 'dark' | 'light',       // тема (кнопка ☀️/🌙 на старті, мапі й панелі гри)
  sound: true,
  tutorial: false, tutorialDone: false,   // інтерактивна інструкція з астронавткою Новою
  daySnapshot: {...} | null,     // стан на початок дня (RETRY_DAY)
  history: [{ day, date, event, choice, best, doseGain, stars, snap }],  // зіграні дні; stars 1–3 для «Зоряного шляху»
  stats: { sheltered: 0, fast: 0 },
  resume: 'briefing' | 'result' | … | null,  // останній ігровий екран (GO 'briefing' повертає сюди)
  patches: [...]                 // нашивки тижнів і значки: 'first_steps' | 'shelter_pro' | 'quick' | 'may_storm' | 'low_dose' | 'graduate'
  (lastAllocation більше не використовується: жетонів у грі немає.)
*/

/* ---------- ВИБІР — що відправляє Decision ----------
{ type: 'CHOOSE', option: 0 | 1, ms, timedOut }  — індекс варіанта з briefing.level.options.
Наслідки варіанта (fx) вже пораховані в buildLevel з урахуванням меж шкал і модифікаторів —
рушій застосовує саме їх, а потім щоденні правила CONFIG.daily.

---------- ВІДЛІТ (дні 29–30) ----------
День 29 (рівень 'rocket'): варіант «заправити ракету» (⚡ −4) → launchReady = true. Інакше день 29 повторюється.
День 30: одразу екран 'launch' → LAUNCH_CHOICE:
  'now'  → ☢️ +5 → сертифікат (або евакуація, якщо доза ≥ 100)
  'wait' → 🫁 −15, ☢️ +1 → сертифікат (або евакуація, якщо 🫁 = 0)
*/

/* ---------- 3. BRIEFING — що бачать Briefing і Decision ----------
{
  day: 25, date: '2024-05-11', week: 4, phase: 'night',
  comms: true,                   // false = вчора був X-спалах, немає зв'язку й прогнозу
  event: { type: 'SEP', detail: 'X5.8', donkiIds: [...] },
  warnings: [{ type: 'CME', inDays: 2 }],   // порожньо, якщо comms === false
  textKey: 'day25',              // ключ тексту дня в i18n days.json
  eventHour: 13.98,              // година події (UTC) з ID DONKI — для годинника дня
  level: LEVEL                   // що питають і які наслідки — див. src/game/levels.js (buildLevel)
}
*/

/* ---------- 4. RESULT — що бачить Result ----------
{
  choiceDeltas: { battery: 0, life: 0, mood: -5, science: 0, dose: 3, wall: 0 },  // від вибору
  dailyDeltas: { battery: -1, life: -5, dose: 1 },                               // щоденні правила
  deltas: { battery, life, mood, science, dose },                                // разом
  cold: false,                   // енергії не було — холодно (ще 🫁 −5)
  notes: ['wall' | 'sad'],       // які модифікатори спрацювали
  launchReady: true | undefined, // лише день 29
  choice: { option: 0, id: 'run', kind: 'storm', chore: false, best: true, timedOut: false, fast: true },
  mood: 'happy' | 'worried'
}
*/

/* ---------- 5. ДІЇ (dispatch) — як екрани говорять з рушієм ---------- */
export const ACTIONS = {
  START_GAME: 'START_GAME',               // { type }
  OPEN_DECISION: 'OPEN_DECISION',         // { type }  briefing -> decision
  SUBMIT_ALLOCATION: 'SUBMIT_ALLOCATION', // застаріле: жетонів більше немає (рушій ігнорує)
  NEXT: 'NEXT',                           // { type }  result -> fact -> далі
  RESTART_WEEK: 'RESTART_WEEK',           // { type }
  GO: 'GO',                               // { type, screen }  напр. 'map', 'sources'
  SET_LANG: 'SET_LANG',                   // { type, lang }
  TOGGLE_TIMER: 'TOGGLE_TIMER',           // { type }  вмикає/вимикає таймер
  LAUNCH_CHOICE: 'LAUNCH_CHOICE',         // { type, choice: 'now' | 'wait' }  лише на екрані 'launch'
  CHOOSE: 'CHOOSE',                       // { type, option: 0 | 1, ms, timedOut }  вибір у рівні дня
  RETRY_DAY: 'RETRY_DAY',                 // { type, day? }  переграти зіграний день (типово — останній)
  TOGGLE_THEME: 'TOGGLE_THEME',           // { type }  ☀️ / 🌙
  TOGGLE_SOUND: 'TOGGLE_SOUND',           // { type }
  TUTORIAL_START: 'TUTORIAL_START',       // { type }  показати інструкцію ще раз
  TUTORIAL_END: 'TUTORIAL_END',           // { type }
};

/* ---------- 6. ПРОПСИ КОМПОНЕНТІВ ----------
Кожен екран: <Screen state={state} dispatch={dispatch} t={t} />
t(key, params) — переклад, напр. t('decision.title'), t('days.day25.text')
*/
