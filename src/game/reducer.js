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
import facts from '../data/facts.json' with { type: 'json' };

/** Факт після рівня: спершу факт цього дня, потім ще не бачені, і жоден — не більше 2 разів за гру. */
const MAX_FACT_SHOWS = 2;
export function pickFact(day, factLog = {}) {
  const ids = facts.map((f) => f.id);
  const order = [day, ...ids.filter((id) => id > CONFIG.totalDays), ...ids.filter((id) => id !== day && id <= CONFIG.totalDays)];
  const seen = (id) => factLog[id] ?? 0;
  return order.find((id) => ids.includes(id) && seen(id) === 0)
    ?? order.find((id) => ids.includes(id) && seen(id) < MAX_FACT_SHOWS)
    ?? day;
}

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

/** Ключ міні-гри варіанта (для лічильника варіантів). */
const gameKeyOf = (o) => (o.chore ? o.id : o.game ?? null);

/**
 * Як результат великої міні-гри змінює наслідки вибору — логічно й видимо:
 * погано почищені панелі — менше енергії, недобудована стіна — без захисту,
 * запізнився в укриття — трохи більше радіації, налаштував зв'язок — настрій кращий.
 */
function withGameResult(o, game) {
  if (!game) return { option: o, effect: null };
  const G = CONFIG.games;
  const fx = { ...o.fx };
  let effect = null;
  if (o.chore && o.id === 'panels' && game.score < G.patrolGoal && fx.battery > 0) {
    const full = fx.battery;
    fx.battery = Math.max(1, Math.round(full * game.score));
    effect = { key: 'patrol', battery: fx.battery - full };
  } else if (o.chore && o.id === 'wall' && !game.success && fx.wall) {
    fx.wall = 0;
    effect = { key: 'wall', wall: -1 };
  } else if (o.game === 'dash' && !game.success) {
    fx.dose = (fx.dose ?? 0) + G.lateShelterDose;
    effect = { key: 'dash', dose: G.lateShelterDose };
  } else if (o.game === 'signal') {
    const d = game.success ? G.signalWinMood : G.signalFailMood;
    fx.mood = (fx.mood ?? 0) + d;
    effect = { key: game.success ? 'signal_ok' : 'signal_fail', mood: d };
  }
  return { option: { ...o, fx }, effect };
}

/** Вибір варіанта → наслідки + дані для реакції Ліри, зірок і значків. */
function choose(state, { option, ms = null, timedOut = false, game = null }) {
  const level = state.briefing?.level;
  const base = level?.options?.[option];
  if (!base || !base.affordable) return state;
  const { option: picked, effect } = withGameResult(base, game);
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
      // програна міні-гра (брудні панелі, запізнився в укриття…) — Ліра хвилюється, можна переграти день
      mood: timedOut || !isBest || (game && !game.success) ? 'worried' : 'happy',
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

  // Справа: наступного разу — інший варіант міні-гри. Факт: не більше 2 разів за гру.
  // (Лічильники не входять у знімок дня — переграний день отримує новий варіант і новий факт.)
  const factId = pickFact(state.day, state.factLog);
  const key = gameKeyOf(picked);
  s = {
    ...s,
    choreCount: key && game ? { ...state.choreCount, [key]: (state.choreCount?.[key] ?? 0) + 1 } : state.choreCount,
    factLog: { ...state.factLog, [factId]: (state.factLog?.[factId] ?? 0) + 1 },
    result: {
      ...s.result,
      factId,
      game: game ? { id: key, success: Boolean(game.success), score: game.score ?? 1, effect } : null,
    },
  };

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
