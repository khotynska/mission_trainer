// Переходи між екранами + виклики рушія. Власник: Tech Lead.
//
// Темп гри (відгук тестувальників):
// • граємо лише дні з реальними подіями; спокійні дні проходять на автопілоті й показуються
//   однією карткою-підсумком (екран 'calm');
// • рішення дня — дилема з двох кнопок (ACTIONS.CHOOSE), а не розкладання жетонів;
// • невдалий день можна переграти (ACTIONS.RETRY_DAY), а не починати весь тиждень;
// • значки за досягнення додаються в state.patches (зберігаються, як і нашивки тижнів).
import { ACTIONS } from './contracts.js';
import { createGame, startDay, resolveDay, resolveLaunch, checkEnd, checkWeekGoal, isCalmDay } from './gameEngine.js';
import { autoAllocation } from './dilemmas.js';
import { CONFIG } from './config.js';

const snapshot = (s) => ({ day: s.day, battery: s.battery, life: s.life, dose: s.dose, science: s.science, launchReady: s.launchReady });

/** Повний знімок для «Переграти день». */
const daySnapshotOf = (s) => ({
  ...snapshot(s),
  weekSnapshot: s.weekSnapshot,
  weekLog: s.weekLog,
  lastAllocation: s.lastAllocation,
  stats: s.stats,
});

/** Екрани всередині місії: на них повертає «Продовжити» зі стартового екрана. */
const GAME_SCREENS = ['briefing', 'decision', 'result', 'fact', 'calm', 'weekComplete', 'evacuation', 'launch', 'certificate'];

const award = (state, id) => (state.patches.includes(id) ? state : { ...state, patches: [...state.patches, id] });

function withWeekSnapshot(state) {
  const isWeekStart = (state.day - 1) % 7 === 0;
  return isWeekStart || !state.weekSnapshot ? { ...state, weekSnapshot: snapshot(state), weekLog: [] } : state;
}

/** Зіграний день: брифінг + дилема. */
function beginDay(state, days) {
  const s = withWeekSnapshot(state);
  return { ...s, daySnapshot: daySnapshotOf(s), briefing: startDay(s, days), result: null, calmLog: [], screen: 'briefing' };
}

/** Спокійні дні поспіль — на автопілоті, доки не прийде подія, кінець тижня чи кінець місії. */
function runCalmDays(state, days) {
  let s = state;
  const log = [];
  for (;;) {
    s = withWeekSnapshot(s);
    const briefing = startDay(s, days);
    s = resolveDay({ ...s, briefing }, days, autoAllocation(s, briefing));
    log.push({
      day: briefing.day,
      date: briefing.date,
      phase: briefing.phase,
      event: briefing.event.type,
      detail: briefing.event.detail,
      warnings: briefing.warnings,
      deltas: s.result.deltas,
    });
    if (checkEnd(s) !== 'continue') break;
    if (!isCalmDay(days, s.day + 1)) break;
    s = { ...s, day: s.day + 1 };
  }
  return { ...s, calmLog: log, screen: 'calm' };
}

/** Почати день state.day: спокійний → автопілот, інакше — брифінг. */
function enterDay(state, days) {
  if (!days.some((d) => d.day === state.day)) return { ...state, screen: 'certificate' };
  return isCalmDay(days, state.day) ? runCalmDays(state, days) : beginDay(state, days);
}

const evacuate = (s) => ({ ...s, screen: 'evacuation', endReason: s.dose >= CONFIG.doseLimit ? 'dose' : 'life' });

function nextDay(state, days) {
  if (!days.some((d) => d.day === state.day + 1)) return { ...state, screen: 'certificate' };
  return enterDay({ ...state, day: state.day + 1 }, days);
}

/** Що далі після завершеного дня (зіграного чи на автопілоті). */
function afterDay(state, days) {
  const end = checkEnd(state);
  if (end === 'evacuated') return evacuate(state);
  let s = state.day === CONFIG.stormBadgeDay ? award(state, 'may_storm') : state;
  if (end === 'repeatDay') return beginDay(s, days); // день 29 без підготовки ракети
  if (end === 'launch') return { ...s, screen: 'launch' };
  if (end === 'weekComplete') {
    const weekResult = checkWeekGoal(s);
    const { patch } = weekResult;
    if (patch) s = award(s, patch);
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

/** Вибір у дилемі → звичайний розрахунок дня + дані для реакції Ліри й значків. */
function choose(state, days, { option, ms = null, timedOut = false }) {
  const dilemma = state.briefing?.dilemma;
  const picked = dilemma?.options?.[option];
  if (!picked) return state;
  let s = resolveDay(state, days, picked.allocation);

  const isBest = dilemma.best === -1 || dilemma.best === option;
  const fast = !timedOut && Number.isFinite(ms) && ms <= CONFIG.fastAnswerMs;
  const sheltered = picked.id === 'shelter' && dilemma.kind === 'storm';
  const stats = {
    sheltered: s.stats.sheltered + (sheltered ? 1 : 0),
    fast: s.stats.fast + (fast ? 1 : 0),
  };
  s = {
    ...s,
    stats,
    result: {
      ...s.result,
      choice: { option, id: picked.id, kind: dilemma.kind, best: isBest, timedOut, fast },
      mood: timedOut || !isBest ? 'worried' : 'happy',
    },
  };

  // Історія зіграних днів: з екрана евакуації можна повернутися в будь-який із них.
  // ★★★ — розумний вибір; ★★ — ризикнув, але доза мала; ★ — інше (зокрема «час вийшов»).
  const doseGain = s.result.deltas.dose;
  const stars = timedOut ? 1 : isBest ? 3 : doseGain < 5 ? 2 : 1;
  const entry = {
    day: state.day,
    date: state.briefing.date,
    event: state.briefing.event.type,
    choice: picked.id,
    best: isBest,
    doseGain,
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
      return enterDay(
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
    }

    case ACTIONS.OPEN_DECISION:
      return { ...state, screen: 'decision' };

    case ACTIONS.CHOOSE:
      if (!state.briefing || state.result) return state; // подвійний клік / день уже пораховано
      return choose(state, days, action);

    case ACTIONS.SUBMIT_ALLOCATION:
      if (!state.briefing || state.result) return state;
      return { ...resolveDay(state, days, action.allocation), screen: 'result' };

    case ACTIONS.NEXT: {
      if (['result', 'fact', 'calm'].includes(state.screen)) return afterDay(state, days);
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
      return enterDay({ ...state, ...s, weekLog: [], weekSnapshot: null, endReason: null, result: null }, days);
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
      // «Продовжити» зі старту веде туди, де гравець зупинився (а не на вже порахований брифінг).
      if (action.screen === 'briefing' && state.resume && state.resume !== 'briefing') {
        return { ...state, screen: state.resume };
      }
      return { ...state, screen: action.screen };
    }

    case ACTIONS.SET_LANG:
      return { ...state, lang: action.lang };

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
