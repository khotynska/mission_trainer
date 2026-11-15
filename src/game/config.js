// Усі числа балансу гри в одному місці. Змінює лише Tech Lead (за результатами симулятора).
export const CONFIG = {
  totalDays: 30,
  startBattery: 5,
  batteryMax: 12,
  incomeDay: 5,
  incomeNight: 2,
  startLife: 80,
  lifeMax: 100,
  lifeDecay: 10,
  lifePerToken: 10,
  sciencePerToken: 5,
  scienceGoal: 150,
  shield: [0, 0.5, 0.75, 0.9], // захист за 0..3 жетони
  maxShieldTokens: 3,
  dose: { QUIET: 0, M: 2, X: 5, X5: 8, CME: 10, EXTREME: 15, SEP: 25 },
  background: 1,
  doseLimit: 100,
  launchPrepTokens: 4, // день 29: жетони на підготовку ракети
  launchNowDose: 5,    // день 30, «злетіти зараз»: +доза
  launchWaitLife: 15,  // день 30, «почекати»: −життєзабезпечення
  warningHorizon: 3,   // за скільки днів показувати попередження про CME

  // ---- Темп гри: граємо лише дні з реальними подіями ----
  // Дні з такою головною подією проходять «на автопілоті» й показуються однією карткою-підсумком.
  calmEvents: ['QUIET', 'M'],
  tutorialDay: 1,      // перший день завжди граємо: навчання
  launchPrepDay: 29,   // підготовка ракети — завжди граємо

  // ---- Дилеми ----
  // Таймер дилеми (с): спершу довгий, щоб діти освоїлися, під час великої бурі — коротший.
  dilemmaSeconds: [
    { upToDay: 1, seconds: 0 },   // навчальний день без таймера
    { upToDay: 10, seconds: 20 },
    { upToDay: 21, seconds: 15 },
    { upToDay: 30, seconds: 12 },
  ],
  // За скільки годин до події Ліра ставить питання (час, коли годинник гальмує).
  leadHours: { CME: 3, EXTREME: 3, SEP: 1, X: 1, X5: 1, M: 0, QUIET: 0 },
  defaultEventHour: 12, // якщо в ID DONKI немає часу події саме цього дня

  // ---- Значки за досягнення ----
  fastAnswerMs: 4000,   // «швидка відповідь»
  fastBadgeCount: 5,    // стільки швидких відповідей → значок ⚡
  shelterBadgeCount: 3, // стільки разів сховався від бурі → значок 🏃
  stormBadgeDay: 28,    // пережив день 28 (кінець травневої бурі 2024) → значок 🌪️
  lowDoseBadge: 60,     // завершив місію з дозою нижче → значок 💚
  goldDoseMax: 70,      // ранг: доза не дійшла до червоної зони (70 % ліміту)
};

// Цілі тижнів: start — стан на початок тижня, end — стан наприкінці, log — дні тижня
export const WEEK_GOALS = {
  1: { patch: 'energy', check: (start, end) => end.battery >= 8 && end.life >= 70 },
  2: { patch: 'science', check: (start, end) => end.science - start.science >= 60 && end.battery >= 12 },
  3: { patch: 'night', check: (start, end, log) => log.every((d) => d.life >= 50) },
  4: { patch: 'shield', check: (start, end) => end.dose - start.dose <= 20 },
};
