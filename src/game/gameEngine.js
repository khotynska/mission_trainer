// Ігровий рушій: чисті функції, без React. Власник: Tech Lead.
// Логіка «причина → наслідок»: вибір дає рівно ті зміни, що показані на кнопці (levels.js),
// а потім діють щоденні правила (CONFIG.daily), які теж показуються окремим рядком.
import { CONFIG, WEEK_GOALS } from './config.js';
import { buildLevel } from './levels.js';

export function createGame(lang = 'ua') {
  return {
    screen: 'start',
    day: 1,
    battery: CONFIG.startBattery,
    life: CONFIG.startLife,
    mood: CONFIG.startMood,
    dose: 0,
    science: 0,
    wall: 0,                // рівень укріплення укриття (0…CONFIG.wallMax)
    patches: [],
    lang,
    briefing: null,
    result: null,
    weekSnapshot: null,
    weekLog: [],
    endReason: null,
    lastWeekResult: null,
    launchReady: false,
    // ---- досвід дитини ----
    timerOn: true,          // таймер у днях із бурями (можна вимкнути 🐢)
    theme: 'dark',          // 'dark' | 'light'
    sound: true,
    tutorial: false,        // true = зараз іде інтерактивна інструкція
    tutorialDone: false,
    daySnapshot: null,      // стан на початок дня (для «Переграти день»)
    history: [],            // зіграні дні: { day, date, event, choice, best, doseGain, stars, snap }
    stats: { sheltered: 0, fast: 0 },
    choreCount: {},         // скільки разів робили кожну справу — щоб міні-гра щоразу була інша
    factLog: {},            // скільки разів показали кожен факт (не більше 2 за гру)
    resume: null,           // останній ігровий екран (для «Продовжити»)
  };
}

const getDay = (days, n) => days.find((d) => d.day === n);
const isX = (type) => type === 'X' || type === 'X5';
const clamp = (v, max) => Math.max(0, Math.min(max, v));
const round1 = (v) => Math.round(v * 10) / 10;

// Тип DONKI в ID ('…T13:59:00-SEP-001') для кожної головної події.
const ID_TYPE = { SEP: ['SEP'], CME: ['GST', 'IPS'], EXTREME: ['GST', 'IPS'], X: ['FLR'], X5: ['FLR'], M: ['FLR'], QUIET: ['FLR'] };

/** Година події (UTC, з дробом) з ID DONKI саме цього дня; інакше CONFIG.defaultEventHour. */
export function eventHourOf(day) {
  const parsed = (day.donkiIds || [])
    .map((id) => id.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}).*-([A-Z]+)-\d+$/))
    .filter((m) => m && m[1] === day.date)
    .map((m) => ({ type: m[4], hour: Number(m[2]) + Number(m[3]) / 60 }));
  const wanted = ID_TYPE[day.mainEvent] || [];
  const hit = parsed.find((p) => wanted.includes(p.type)) || parsed.find((p) => p.type === 'FLR');
  return hit ? hit.hour : CONFIG.defaultEventHour;
}

/** Брифінг дня: дані NASA + рівень (питання й варіанти з наслідками). */
export function startDay(state, days) {
  const day = getDay(days, state.day);
  if (!day) throw new Error(`days.json: no day ${state.day}`);
  const prev = getDay(days, state.day - 1);
  const comms = !(prev && isX(prev.mainEvent));

  const warnings = [];
  if (comms) {
    days
      .filter((d) => d.day <= state.day)
      .forEach((d) =>
        (d.cmeLaunched || []).forEach(({ arrivalDay }) => {
          const inDays = arrivalDay - state.day;
          if (inDays >= 1 && inDays <= CONFIG.warningHorizon) warnings.push({ type: 'CME', inDays });
        }),
      );
  }

  return {
    day: day.day,
    date: day.date,
    week: day.week,
    phase: day.phase,
    comms,
    event: { type: day.mainEvent, detail: day.detail || '', donkiIds: day.donkiIds || [] },
    warnings,
    textKey: `day${day.day}`,
    eventHour: eventHourOf(day),
    level: buildLevel(state, day),
  };
}

/** Щоденні правила після вибору. Повертає новий стан і що саме змінилося. */
function applyDaily(s, phase) {
  const d = CONFIG.daily;
  const daily = { life: 0, dose: d.dose, battery: 0 };
  let battery = s.battery + (phase === 'night' ? d.batteryNight : d.batteryDay);
  let cold = false;
  if (battery < 0) {
    cold = true;
    battery = 0;
  }
  battery = clamp(battery, CONFIG.batteryMax);
  daily.battery = battery - s.battery;
  const life = clamp(s.life + d.life + (cold ? d.coldLife : 0), CONFIG.lifeMax);
  daily.life = life - s.life;
  return { state: { ...s, battery, life, dose: round1(s.dose + d.dose) }, daily, cold };
}

/** Вибір варіанта: наслідки вибору + щоденні правила. */
export function resolveChoice(state, option) {
  const b = state.briefing;
  const fx = option.fx ?? {};
  let s = {
    ...state,
    battery: clamp(state.battery + (fx.battery ?? 0), CONFIG.batteryMax),
    life: clamp(state.life + (fx.life ?? 0), CONFIG.lifeMax),
    mood: clamp(state.mood + (fx.mood ?? 0), CONFIG.moodMax),
    science: state.science + (fx.science ?? 0),
    dose: round1(state.dose + (fx.dose ?? 0)),
    wall: Math.min(CONFIG.wallMax, (state.wall ?? 0) + (fx.wall ?? 0)),
    launchReady: state.launchReady || Boolean(option.launch),
  };
  const choiceDeltas = {
    battery: s.battery - state.battery,
    life: s.life - state.life,
    mood: s.mood - state.mood,
    science: s.science - state.science,
    dose: round1(s.dose - state.dose),
    wall: s.wall - (state.wall ?? 0),
  };
  const { state: after, daily, cold } = applyDaily(s, b.phase);
  s = after;

  return {
    ...s,
    result: {
      choiceDeltas,
      dailyDeltas: daily,
      deltas: {
        battery: s.battery - state.battery,
        life: s.life - state.life,
        mood: s.mood - state.mood,
        science: s.science - state.science,
        dose: round1(s.dose - state.dose),
      },
      cold,
      notes: option.notes ?? [],
      launchReady: b.day === CONFIG.launchPrepDay ? s.launchReady : undefined,
    },
    weekLog: [...state.weekLog, { day: state.day, battery: s.battery, life: s.life, mood: s.mood, dose: s.dose, science: s.science }],
  };
}

// 'evacuated' | 'weekComplete' | 'repeatDay' | 'continue'
export function checkEnd(state) {
  if (state.dose >= CONFIG.doseLimit) return 'evacuated';
  if (state.life <= 0) return 'evacuated';
  if (state.day === CONFIG.launchPrepDay && !state.launchReady) return 'repeatDay';
  if (state.day % 7 === 0 && state.day <= 28) return 'weekComplete';
  return 'continue';
}

// Вибір на екрані 'launch' (день 30)
export function resolveLaunch(state, choice) {
  const L = CONFIG.launch;
  if (choice === 'now') return { ...state, dose: round1(state.dose + L.nowDose) };
  return { ...state, dose: round1(state.dose + L.waitDose), life: clamp(state.life - L.waitLife, CONFIG.lifeMax) };
}

export function checkWeekGoal(state) {
  const week = Math.ceil(state.day / 7);
  const goal = WEEK_GOALS[week];
  if (!goal || !state.weekSnapshot) return { week, passed: false, patch: null };
  const passed = goal.check(state.weekSnapshot, state, state.weekLog);
  return { week, passed, patch: passed ? goal.patch : null };
}

export function getRank(state) {
  if (state.dose >= CONFIG.doseLimit || state.life <= 0) return null;
  // Золото: і наука зібрана, і доза не дійшла до червоної зони. Срібло: одне з двох. Бронза: екіпаж удома.
  const science = state.science >= CONFIG.scienceGoal;
  const safe = state.dose < CONFIG.goldDoseMax;
  if (science && safe) return 'gold';
  if (science || safe) return 'silver';
  return 'bronze';
}
