// Переходи між екранами + виклики рушія. Власник: Tech Lead.
//
// • Після стартового екрана відкривається «Зоряний шлях» (мапа рівнів), звідти — день.
// • Кожен із 30 днів — рівень: спокійний день — справи на базі з маленьким завданням,
//   день із подією — дилема з таймером; день 30 — екран старту ракети.
// • Рішення — ACTIONS.CHOOSE: наслідки рівно ті, що показані на кнопці (src/game/levels.js), плюс щоденні правила.
// • Невдалий день можна переграти (ACTIONS.RETRY_DAY), значки додаються в state.patches.
import { ACTIONS } from './contracts.js';
import { createGame, startDay, resolveChoice, resolveLaunch, checkEnd, checkWeekGoal } from './gameEngine.js';
import { CONFIG } from './config.js';

const snapshot = (s) => ({
  day: s.day, battery: s.battery, life: s.life, mood: s.mood, dose: s.dose, science: s.science, wall: s.wall, launchReady: s.launchReady,
});

/** Повний знімок для «Переграти день». */
const daySnapshotOf = (s) => ({ ...snapshot(s), weekSnapshot: s.weekSnapshot, weekLog: s.weekLog, stats: s.stats });

/** Екрани всередині місії: на них повертає «Продовжити» / «Грати» на мапі. */
const GAME_SCREENS = ['briefing', 'decision', 'result', 'fact', 'weekComplete', 'evacuation', 'launch', 'certificate'];

const award = (state, id) => (state.patches.includes(id) ? state : { ...state, patches: [...state.patches, id] });

function withWeekSnapshot(state) {
  const isWeekStart = (state.day - 1) % 7 === 0;
  return isWeekStart || !state.weekSnapshot ? { ...state, weekSnapshot: snapshot(state), weekLog: [] } : state;
}

/** Почати день state.day: брифінг із рівнем (день 30 — одразу екран ракети). */
function beginDay(state, days) {
  if (!days.some((d) => d.day === state.day)) return { ...state, screen: 'certificate' };
  const s = withWeekSnapshot(state);
  const briefing = startDay(s, days);
  const screen = briefing.level.kind === 'launch' ? 'launch' : 'briefing';
  return { ...s, daySnapshot: daySnapshotOf(s), briefing, result: null, screen };
}

const evacuate = (s) => ({ ...s, screen: 'evacuation', endReason: s.dose >= CONFIG.doseLimit ? 'dose' : 'life' });

function nextDay(state, days) {
  return beginDay({ ...state, day: state.day + 1 }, days);
}

/** Що далі після завершеного дня. */
function afterDay(state, days) {
  const end = checkEnd(state);
  if (end === 'evacuated') return evacuate(state);
  let s = state.day === CONFIG.stormBadgeDay ? award(state, 'may_storm') : state;
  if (end === 'repeatDay') return beginDay(s, days); // день 29 без заправленої ракети
  if (end === 'weekComplete') {
    const weekResult = checkWeekGoal(s);
    if (weekResult.patch) s = award(s, weekResult.patch);
    return { ...s, lastWeekResult: weekResult, screen: 'weekComplete' };
  }
  return nextDay(s, days);
}

/** Сертифікат: значки за всю місію. */
function finishMission(state) {
  let s = award(state, 'graduate');
  if (s.dose < CONFIG.lowDoseBadge) s = award(s, 'low_dose');
  return { ...s, screen: 'certificate' };
}

/** Вибір варіанта → наслідки + дані для реакції Ліри, зірок і значків. */
function choose(state, { option, ms = null, timedOut = false }) {
  const level = state.briefing?.level;
  const picked = level?.options?.[option];
  if (!picked || !picked.affordable) return state;
  let s = resolveChoice(state, picked);

  const isBest = level.best === -1 || level.best === option;
  const timed = level.seconds > 0;
  const fast = timed && !timedOut && Number.isFinite(ms) && ms <= CONFIG.fastAnswerMs;
  const sheltered = Boolean(picked.shelter) && level.kind === 'storm';
  const stats = { sheltered: s.stats.sheltered + (sheltered ? 1 : 0), fast: s.stats.fast + (fast ? 1 : 0) };
  s = {
    ...s,
    stats,
    result: {
      ...s.result,
      choice: { option, id: picked.id, kind: level.kind, chore: Boolean(picked.chore), best: isBest, timedOut, fast },
      mood: timedOut || !isBest ? 'worried' : 'happy',
    },
  };

  // ★★★ — розумний вибір (або день без «правильної» відповіді); ★★ — ризикнув, але радіації мало; ★ — інше.
  const doseGain = s.result.choiceDeltas.dose;
  const stars = timedOut ? 1 : isBest ? 3 : doseGain < 8 ? 2 : 1;
  const entry = {
    day: state.day,
    date: state.briefing.date,
    event: state.briefing.event.type,
    choice: picked.id,
    best: isBest,
    doseGain: s.result.deltas.dose,
    stars,
    snap: state.daySnapshot,
  };
  s = { ...s, history: [...(state.history || []).filter((h) => h.day < state.day), entry].slice(-CONFIG.totalDays) };

  if (state.day === CONFIG.tutorialDay) s = award(s, 'first_steps');
  if (stats.sheltered >= CONFIG.shelterBadgeCount) s = award(s, 'shelter_pro');
  if (stats.fast >= CONFIG.fastBadgeCount) s = award(s, 'quick');
  return { ...s, screen: 'result' };
}

function core(state, action, days) {
  switch (action.type) {
    case ACTIONS.START_GAME: {
      const fresh = createGame(state.lang);
      const s = beginDay(
        {
          ...fresh,
          patches: state.patches,
          theme: state.theme ?? fresh.theme,
          sound: state.sound ?? fresh.sound,
          timerOn: state.timerOn ?? fresh.timerOn,
          tutorialDone: state.tutorialDone,
          tutorial: !state.tutorialDone,
        },
        days,
      );
      // Після старту — «Зоряний шлях»; «▶ Грати» на першій зірці відкриває день 1.
      return { ...s, screen: 'map', resume: 'briefing' };
    }

    case ACTIONS.OPEN_DECISION:
      return { ...state, screen: 'decision' };

    case ACTIONS.CHOOSE:
      if (!state.briefing || state.result) return state; // подвійний клік / день уже пораховано
      return choose(state, action);

    case ACTIONS.NEXT: {
      if (state.screen === 'result' || state.screen === 'fact') return afterDay(state, days);
      if (state.screen === 'weekComplete') return nextDay(state, days);
      return state;
    }

    case ACTIONS.RETRY_DAY: {
      // { day } — переграти конкретний зіграний день; без day — останній.
      const target = action.day ?? state.daySnapshot?.day;
      const fromHistory = (state.history || []).find((h) => h.day === target)?.snap;
      const snap = fromHistory ?? (state.daySnapshot?.day === target ? state.daySnapshot : null);
      if (!snap) return state;
      const history = (state.history || []).filter((h) => h.day < snap.day);
      return beginDay({ ...state, ...snap, history, endReason: null, result: null }, days);
    }

    case ACTIONS.RESTART_WEEK: {
      const s = state.weekSnapshot;
      if (!s) return state;
      return beginDay({ ...state, ...s, weekLog: [], weekSnapshot: null, endReason: null, result: null }, days);
    }

    case ACTIONS.LAUNCH_CHOICE: {
      const s = resolveLaunch(state, action.choice);
      if (s.dose >= CONFIG.doseLimit || s.life <= 0) return evacuate(s);
      return finishMission(s);
    }

    case ACTIONS.TOGGLE_TIMER:
      return { ...state, timerOn: !state.timerOn };

    case ACTIONS.TOGGLE_THEME:
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };

    case ACTIONS.TOGGLE_SOUND:
      return { ...state, sound: !state.sound };

    case ACTIONS.TUTORIAL_START:
      return { ...state, tutorial: true };

    case ACTIONS.TUTORIAL_END:
      return { ...state, tutorial: false, tutorialDone: true };

    case ACTIONS.GO: {
      // «Продовжити» / «Грати» на мапі веде туди, де гравець зупинився.
      if (action.screen === 'briefing' && state.resume && state.resume !== 'briefing') {
        return { ...state, screen: state.resume };
      }
      return { ...state, screen: action.screen };
    }

    case ACTIONS.SET_LANG:
      return { ...state, lang: action.lang };

    // SUBMIT_ALLOCATION лишився в контрактах для сумісності, але жетонів у грі більше немає.
    default:
      return state;
  }
}

export function makeReducer(days) {
  return function reducer(state, action) {
    const next = core(state, action, days);
    if (next !== state && GAME_SCREENS.includes(next.screen) && next.resume !== next.screen) {
      return { ...next, resume: next.screen };
    }
    return next;
  };
}
