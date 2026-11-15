// Усі числа балансу гри в одному місці. Змінює лише Tech Lead (за результатами симулятора: node scripts/simulate.js).
//
// Логіка гри «причина → наслідок» (жодних прихованих жетонів):
// • кожен варіант у рівні має явні наслідки (src/game/levels.js), і дитина бачить їх на кнопці ще до вибору;
// • після вибору діють лише кілька щоденних правил, і їх теж видно окремим рядком «Щодня»:
//   екіпаж їсть і дихає (🫁 −5), космічний фон (☢️ +1), сонячні панелі вдень (⚡ +2; уночі — 0).
export const CONFIG = {
  totalDays: 30,
  tutorialDay: 1,
  launchPrepDay: 29, // день 29: заправити ракету
  launchDay: 30,     // день 30: злетіти зараз чи почекати (екран 'launch')

  // Стан на старті й межі шкал
  startBattery: 6,
  startLife: 80,
  startMood: 70,
  batteryMax: 12,
  lifeMax: 100,
  moodMax: 100,
  doseLimit: 100,    // на цій дозі ЦУП евакуює екіпаж
  scienceGoal: 150,
  goldDoseMax: 70,   // ранг «золото»: доза не дійшла до червоної зони

  // Щоденні правила
  daily: {
    life: -5,          // екіпаж їсть і дихає
    dose: 1,           // слабкий космічний фон є завжди
    batteryDay: 2,     // сонячні панелі
    batteryNight: 0,   // уночі сонця немає: панелі не заряджають (енергію витрачають лише справи)
    coldLife: -5,      // якщо енергії немає — холодно: ще мінус повітря й тепло
  },
  sadMood: 30,         // настрій нижче — екіпаж сумний: наука вдвічі менша
  wallMax: 2,          // укріплення укриття: кожен рівень −1 ☢️, коли ховаєшся
  launch: { nowDose: 5, waitLife: 15, waitDose: 1 },

  warningHorizon: 3,   // за скільки днів показувати попередження про хмару
  defaultEventHour: 12,
  leadHours: { CME: 3, EXTREME: 3, SEP: 1, X: 1, X5: 1, M: 0, QUIET: 0 },
  // Таймер лише в днях із бурями: спершу довгий, у велику бурю коротший.
  dilemmaSeconds: [
    { upToDay: 10, seconds: 20 },
    { upToDay: 21, seconds: 15 },
    { upToDay: 30, seconds: 12 },
  ],

  // Значки за досягнення
  fastAnswerMs: 4000,
  fastBadgeCount: 5,
  shelterBadgeCount: 3,
  stormBadgeDay: 28,
  lowDoseBadge: 60,
};

// Цілі тижнів: start — стан на початок тижня, end — стан наприкінці, log — дні тижня
export const WEEK_GOALS = {
  1: { patch: 'energy', check: (start, end) => end.battery >= 8 },
  2: { patch: 'science', check: (start, end) => end.science - start.science >= 40 },
  3: { patch: 'night', check: (start, end, log) => log.every((d) => d.life >= 50) },
  4: { patch: 'shield', check: (start, end) => end.dose - start.dose <= 20 },
};
