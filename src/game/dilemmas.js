// Дилеми дня: замість розкладання жетонів дитина обирає одну з двох кнопок.
// Кожен варіант — це готовий ALLOCATION (contracts.js), тож рушій рахує день як і раніше.
// Чисті функції без React та i18n. Власник: Tech Lead.
//
// DILEMMA (лежить у briefing.dilemma):
// {
//   kind: 'storm' | 'flare' | 'tutorial' | 'rocket',
//   event: 'SEP',            // тип події (для тексту питання)
//   leadHours: 1,            // питання з'являється за стільки годин до події
//   seconds: 15,             // таймер; 0 = без таймера
//   best: 0,                 // індекс розумнішого варіанта (-1 = обидва добрі)
//   timeoutOption: 1,        // що станеться, якщо час вийде
//   options: [{ id: 'shelter', icon: '🛡️', allocation: {...}, preview: { dose, science, life, battery } }, …]
// }
import { CONFIG } from './config.js';

const STORM = ['CME', 'EXTREME', 'SEP', 'X5'];
const FLARE = ['X'];

/** Скільки жетонів дати на повітря, щоб життєзабезпечення не падало (−10 за день, +10 за жетон). */
export function lifeNeed(life) {
  if (life <= 60) return 2;
  if (life <= 85) return 1;
  return 0;
}

/** Розкладає T жетонів за списком побажань [['shield', 3], ['life', 1], …] по черзі. */
function split(tokens, wants, extra = {}) {
  const a = { life: 0, shield: 0, science: 0, ...extra };
  let left = tokens - (extra.launch || 0);
  for (const [key, n] of wants) {
    const room = key === 'shield' ? CONFIG.maxShieldTokens - a.shield : Infinity;
    const take = Math.max(0, Math.min(n, left, room));
    a[key] += take;
    left -= take;
  }
  return a;
}

/** Що буде з ресурсами після варіанта (для іконок-підказок на кнопці). Та сама формула, що в resolveDay. */
export function previewAllocation(state, briefing, a) {
  const spent = a.life + a.shield + a.science + (a.launch || 0);
  const battery = Math.min(briefing.tokens - spent, CONFIG.batteryMax);
  const life = Math.max(0, Math.min(CONFIG.lifeMax, state.life - CONFIG.lifeDecay + a.life * CONFIG.lifePerToken));
  const damage = CONFIG.background + (CONFIG.dose[briefing.event.type] ?? 0);
  const dose = Math.round(damage * (1 - CONFIG.shield[a.shield]) * 10) / 10;
  return {
    battery: battery - state.battery,
    life: life - state.life,
    dose,
    science: a.science * CONFIG.sciencePerToken,
  };
}

export function dilemmaSeconds(day) {
  const row = CONFIG.dilemmaSeconds.find((r) => day <= r.upToDay);
  return row ? row.seconds : 0;
}

/**
 * @param {object} state  стан гри на початок дня
 * @param {object} briefing  BRIEFING без dilemma (tokens, event, day…)
 */
export function makeDilemma(state, briefing) {
  const T = briefing.tokens;
  const type = briefing.event.type;
  const need = lifeNeed(state.life);
  const lowLife = state.life <= 50;
  const seconds = dilemmaSeconds(briefing.day);
  const leadHours = CONFIG.leadHours[type] ?? 0;

  // Запасний варіант «працювати далі»: якщо повітря мало — лагодимо його, інакше — наука.
  const work = lowLife
    ? { id: 'repair', icon: '🔧', allocation: split(T, [['life', need + 1], ['science', 1]]) }
    : { id: 'science', icon: '🔬', allocation: split(T, [['life', need], ['science', 4]]) };

  let d;
  if (briefing.day === CONFIG.launchPrepDay) {
    d = {
      kind: 'rocket',
      best: 0,
      timeoutOption: 1,
      options: [
        { id: 'rocket', icon: '🚀', allocation: split(T, [['life', need], ['shield', 3]], { launch: CONFIG.launchPrepTokens }) },
        { id: 'shelter', icon: '🛡️', allocation: split(T, [['life', need], ['shield', 3]]) },
      ],
    };
  } else if (briefing.day === CONFIG.tutorialDay) {
    d = {
      kind: 'tutorial',
      best: -1,
      timeoutOption: 0,
      options: [
        { id: 'garden', icon: '🌱', allocation: split(T, [['life', need + 1], ['science', 1]]) },
        { id: 'science', icon: '🔬', allocation: split(T, [['life', need], ['science', 3]]) },
      ],
    };
  } else if (STORM.includes(type)) {
    // Буря: ховаємось повністю, город почекає (повітря — лише якщо його вже мало: так батарея
    // доживе до кінця бурі). Якщо повітря зовсім мало — спершу дихати.
    const first = state.life <= 30 ? [['life', need]] : [];
    const lifeInShelter = state.life <= 60 ? need : 0;
    d = {
      kind: 'storm',
      best: 0,
      timeoutOption: 1,
      options: [
        { id: 'shelter', icon: '🛡️', allocation: split(T, [...first, ['shield', 3], ['life', lifeInShelter]]) },
        work,
      ],
    };
  } else if (FLARE.includes(type)) {
    d = {
      kind: 'flare',
      best: 0,
      timeoutOption: 1,
      options: [
        { id: 'hide', icon: '🕶️', allocation: split(T, [['life', need], ['shield', 2]]) },
        work,
      ],
    };
  } else {
    // Звичайний день (якщо колись граємо спокійний день): город чи наука.
    d = {
      kind: 'tutorial',
      best: -1,
      timeoutOption: 0,
      options: [
        { id: 'garden', icon: '🌱', allocation: split(T, [['life', need + 1], ['science', 1]]) },
        { id: 'science', icon: '🔬', allocation: split(T, [['life', need], ['science', 3]]) },
      ],
    };
  }

  return {
    ...d,
    event: type,
    leadHours: d.kind === 'tutorial' ? 0 : leadHours,
    seconds: d.kind === 'tutorial' ? 0 : seconds,
    options: d.options.map((o) => ({ ...o, preview: previewAllocation(state, briefing, o.allocation) })),
  };
}

/** Автопілот для спокійних днів: дихаємо, тримаємо батарею повною, надлишок — у науку. */
export function autoAllocation(state, briefing) {
  const T = briefing.tokens;
  const need = lifeNeed(state.life);
  // Слабкий спалах: укриття на 1 жетон (половина дози), решта — запас і наука.
  const shieldWant = (CONFIG.dose[briefing.event.type] ?? 0) > 0 ? 1 : 0;
  const base = split(T, [['life', need], ['shield', shieldWant]]);
  const spent = base.life + base.shield;
  // Наука — лише з того, що не влізе в батарею (батарея — запас на ніч і бурі).
  const overflow = Math.max(0, T - spent - CONFIG.batteryMax);
  return { ...base, science: overflow };
}
