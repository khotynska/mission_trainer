// Рівні місії: що питають у кожен із 30 днів і які наслідки має кожна відповідь.
// Чисті дані + функції без React та i18n. Тексти — у src/i18n/<lang>/levels.json. Власник: Tech Lead.
//
// Принцип: «за цю відповідь — саме це значення». Наслідки (fx) записані тут явно й показуються на кнопці
// ще до вибору. Модифікатори теж логічні й видимі в підказці:
//   • укріплене укриття (🧱) зменшує радіацію, коли ховаєшся;
//   • сумний екіпаж (😊 нижче CONFIG.sadMood) робить науку вдвічі гірше;
//   • якщо енергії не вистачає — дію не обрати (кнопка «⚡ мало енергії»).
//
// fx: { battery, life, mood, science, dose, wall } — зміни від вибору (dose — радіація від події).
// shelter: true — варіант «сховатися»: укріплення укриття зменшує його dose.
import { CONFIG } from './config.js';

/** Справи на базі для спокійних днів: обираєш одну з двох, а потім робиш маленьке завдання (торкнутися предметів). */
export const CHORES = {
  harvest: { icon: '🍅', fx: { life: 20 }, targets: ['🍅', '🥒', '🍅', '🥔', '🍅'] },
  cook: { icon: '🍲', fx: { life: 10, mood: 10, battery: -1 }, targets: ['🥕', '🥔', '🧅', '🍅'] },
  call: { icon: '📞', fx: { mood: 20, battery: -1 }, targets: ['💜', '💛', '💚', '💙'] },
  clean: { icon: '🧹', fx: { mood: 10, life: 5 }, targets: ['🧦', '🥤', '📦', '🧦', '🥤'] },
  panels: { icon: '🧽', fx: { battery: 4 }, targets: ['💨', '💨', '💨', '💨', '💨'] },
  experiment: { icon: '🔬', fx: { science: 20, battery: -1, dose: 1 }, targets: ['🪨', '🪨', '🪨', '🪨', '🪨'] },
  telescope: { icon: '🔭', fx: { science: 15, mood: 5, battery: -1 }, targets: ['⭐', '🌟', '✨', '⭐', '🌟'] },
  wall: { icon: '🧱', fx: { wall: 1, battery: -2, mood: -5 }, targets: ['🧱', '🧱', '🧱', '🧱', '🧱'] },
  generator: { icon: '🔋', fx: { battery: 4, mood: -5 }, targets: ['⚡', '⚡', '⚡', '⚡', '⚡'] },
  games: { icon: '🎲', fx: { mood: 15 }, targets: ['🎲', '🃏', '🎲', '🃏'] },
};

/**
 * 30 днів. kind: 'chore' (спокійний день — справи на базі), 'storm' (буря: ховатися чи ні),
 * 'flare' (сильний спалах: інші наслідки), 'rocket' (день 29), 'launch' (день 30, окремий екран).
 * best — індекс розумнішого варіанта (-1 — обидва добрі); timeout — що станеться, якщо час вийде.
 */
export const LEVELS = {
  1: { kind: 'chore', chores: ['harvest', 'experiment'] },
  2: { kind: 'chore', chores: ['panels', 'call'] },
  3: { kind: 'chore', chores: ['cook', 'experiment'] },
  4: { kind: 'chore', chores: ['wall', 'experiment'] },
  5: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'shelter', icon: '🛡️', fx: { dose: 1, mood: -5 }, shelter: true },
      { id: 'antenna', icon: '📡', fx: { dose: 10, science: 10 } },
    ],
  },
  6: { kind: 'chore', chores: ['harvest', 'call'] },
  7: { kind: 'chore', chores: ['clean', 'panels'] },
  8: { kind: 'chore', chores: ['experiment', 'cook'] },
  9: { kind: 'chore', chores: ['wall', 'harvest'] },
  10: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'garage', icon: '🚙', fx: { dose: 1, battery: -2 }, shelter: true },
      { id: 'rocks', icon: '🪨', fx: { dose: 10, science: 20 } },
    ],
  },
  11: { kind: 'chore', chores: ['panels', 'experiment'] },
  12: { kind: 'chore', chores: ['experiment', 'games'] },
  13: { kind: 'chore', chores: ['harvest', 'panels'] },
  14: { kind: 'chore', chores: ['panels', 'cook'] },
  15: { kind: 'chore', chores: ['generator', 'telescope'] },
  16: { kind: 'chore', chores: ['cook', 'call'] },
  17: {
    kind: 'flare', best: -1, timeout: 1, options: [
      { id: 'callnow', icon: '📞', fx: { mood: 15, battery: -1 } },
      { id: 'record', icon: '📈', fx: { science: 15, battery: -1 } },
    ],
  },
  18: { kind: 'chore', chores: ['games', 'telescope'] },
  19: {
    kind: 'flare', best: 0, timeout: 1, options: [
      { id: 'cover', icon: '🌱', fx: { battery: -2 } },
      { id: 'save', icon: '🔌', fx: { life: -10 } },
    ],
  },
  20: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'shelter', icon: '🛡️', fx: { dose: 1, mood: -5 }, shelter: true },
      { id: 'finish', icon: '🔬', fx: { dose: 10, science: 20 } },
    ],
  },
  21: { kind: 'chore', chores: ['wall', 'harvest'] },
  22: {
    kind: 'flare', best: -1, timeout: 1, options: [
      { id: 'wall', icon: '🧱', fx: { wall: 1, battery: -2 } },
      { id: 'lab', icon: '🔬', fx: { science: 15 } },
    ],
  },
  23: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'run', icon: '🏃', fx: { dose: 3, mood: -5 }, shelter: true },
      { id: 'boxes', icon: '📦', fx: { dose: 15, life: 15 } },
    ],
  },
  24: {
    kind: 'storm', best: -1, timeout: 1, options: [
      { id: 'water', icon: '💧', fx: { dose: 8, life: 10 } },
      { id: 'wait', icon: '⏳', fx: { dose: 3, life: -10 }, shelter: true },
    ],
  },
  25: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'deep', icon: '🛡️', fx: { dose: 3, mood: -5 }, shelter: true },
      { id: 'photo', icon: '📸', fx: { dose: 25, science: 25 } },
    ],
  },
  26: {
    kind: 'flare', best: -1, timeout: 1, options: [
      { id: 'boardgame', icon: '🎲', fx: { mood: 15 } },
      { id: 'record', icon: '📈', fx: { science: 15, battery: -1 } },
    ],
  },
  27: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'stay', icon: '🛡️', fx: { dose: 3, mood: -5 }, shelter: true },
      { id: 'tune', icon: '📡', fx: { dose: 25, science: 10, mood: 10 } },
    ],
  },
  28: {
    kind: 'storm', best: 0, timeout: 1, options: [
      { id: 'shelter', icon: '🛡️', fx: { dose: 1, mood: -5 }, shelter: true },
      { id: 'record', icon: '📈', fx: { dose: 9, science: 25 } },
    ],
  },
  29: {
    kind: 'rocket', best: 0, timeout: 1, options: [
      { id: 'fuel', icon: '⛽', fx: { battery: -4, dose: 2, launch: true } },
      { id: 'hide', icon: '🛡️', fx: { dose: 1 }, shelter: true },
    ],
  },
  30: { kind: 'launch' },
};

const TIMED = ['storm', 'flare'];
/** Запасні справи, якщо запланована зараз нічого не дасть. */
const SWAP_CHORES = ['clean', 'cook', 'games', 'harvest'];
const FX_KEYS = ['battery', 'life', 'mood', 'science', 'dose', 'wall'];
const MAX = { battery: CONFIG.batteryMax, life: CONFIG.lifeMax, mood: CONFIG.moodMax };

export function dilemmaSeconds(day) {
  const row = CONFIG.dilemmaSeconds.find((r) => day <= r.upToDay);
  return row ? row.seconds : 0;
}

/**
 * Скільки насправді зміниться від цього варіанта при поточному стані (з урахуванням меж шкал і модифікаторів).
 * Саме ці числа показує кнопка, і саме їх отримає гравець — без сюрпризів.
 */
export function finalFx(state, option) {
  const fx = {};
  const notes = [];
  for (const k of FX_KEYS) {
    let v = option.fx[k] ?? 0;
    if (k === 'science' && v > 0 && state.mood < CONFIG.sadMood) {
      v = Math.floor(v / 2);
      notes.push('sad');
    }
    if (k === 'dose' && option.shelter && (state.wall ?? 0) > 0 && v > 0) {
      v = Math.max(0, v - state.wall);
      notes.push('wall');
    }
    if (k === 'wall') v = Math.min(v, CONFIG.wallMax - (state.wall ?? 0));
    if (MAX[k] !== undefined && v > 0) v = Math.min(v, MAX[k] - state[k]);
    if (v !== 0) fx[k] = v;
  }
  const cost = -(option.fx.battery ?? 0);
  const affordable = cost <= 0 || state.battery >= cost;
  return { fx, notes, affordable, launch: Boolean(option.fx.launch) };
}

function choreOption(id) {
  const c = CHORES[id];
  return { id, icon: c.icon, fx: c.fx, targets: c.targets, chore: true };
}

/**
 * Рівень дня для поточного стану: питання, два варіанти з остаточними наслідками, таймер.
 * @param {object} state  стан гри на початок дня
 * @param {{ day: number, phase: string }} dayData  день із days.json
 */
export function buildLevel(state, dayData) {
  const def = LEVELS[dayData.day] ?? { kind: 'chore', chores: ['harvest', 'games'] };
  if (def.kind === 'launch') return { kind: 'launch', options: [], best: -1, timeout: 0, seconds: 0 };

  let raw;
  if (def.kind === 'chore') {
    raw = def.chores.map((id) => (id === 'wall' && (state.wall ?? 0) >= CONFIG.wallMax ? 'clean' : id)).map(choreOption);
  } else {
    raw = def.options;
  }

  let options = raw.map((o) => ({ ...o, ...finalFx(state, o) }));
  // Справа, яка зараз нічого не дасть (напр. чистити панелі, коли батарея повна), — замінюємо на корисну.
  if (def.kind === 'chore') {
    options = options.map((o) => {
      if (Object.keys(o.fx).length > 0) return o;
      const alt = SWAP_CHORES.map(choreOption)
        .filter((c) => !options.some((x) => x.id === c.id))
        .map((c) => ({ ...c, ...finalFx(state, c) }))
        .find((c) => Object.keys(c.fx).length > 0 && c.affordable);
      return alt ?? o;
    });
  }
  // Завжди має бути хоча б одна доступна дія: якщо на обидві бракує енергії — друга стає безкоштовною грою.
  if (options.every((o) => !o.affordable)) {
    const free = choreOption('games');
    options = [options[0], { ...free, ...finalFx(state, free) }];
  }

  return {
    kind: def.kind,
    best: def.best ?? -1,
    timeout: def.timeout ?? 0,
    seconds: TIMED.includes(def.kind) ? dilemmaSeconds(dayData.day) : 0,
    leadHours: TIMED.includes(def.kind) || def.kind === 'rocket' ? (CONFIG.leadHours[dayData.mainEvent] ?? 0) : 0,
    options,
  };
}
