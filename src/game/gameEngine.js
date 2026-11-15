// Ігровий рушій: чисті функції, без React. Власник: Tech Lead.
import { CONFIG, WEEK_GOALS } from './config.js';
import { makeDilemma } from './dilemmas.js';

export function createGame(lang = 'ua') {
  return {
    screen: 'start',
    day: 1,
    battery: CONFIG.startBattery,
    life: CONFIG.startLife,
    dose: 0,
    science: 0,
    patches: [],
    lang,
    briefing: null,
    result: null,
    lastAllocation: { life: 1, shield: 0, science: 0 },
    weekSnapshot: null,
    weekLog: [],
    endReason: null,
    lastWeekResult: null,
    launchReady: false,
    // ---- темп і досвід дитини ----
    timerOn: true,          // дилеми з таймером (можна вимкнути 🐢)
    theme: 'dark',          // 'dark' | 'light'
    sound: true,
    tutorial: false,        // true = зараз іде інтерактивна інструкція
    tutorialDone: false,    // інструкцію вже пройдено (зберігається)
    daySnapshot: null,      // стан на початок зіграного дня (для «Переграти день»)
    history: [],            // зіграні дні: { day, date, event, choice, best, doseGain, snap } — можна переграти будь-який
    calmLog: [],            // спокійні дні, що пройшли на автопілоті (картка-підсумок)
    stats: { sheltered: 0, fast: 0 },
    resume: null,           // останній ігровий екран (для «Продовжити» зі старту)
  };
}

const getDay = (days, n) => days.find((d) => d.day === n);
const isX = (type) => type === 'X' || type === 'X5';

/** Спокійний день — граємо його на автопілоті (див. CONFIG.calmEvents). */
export function isCalmDay(days, n) {
  const day = getDay(days, n);
  if (!day) return false;
  if (n === CONFIG.tutorialDay || n === CONFIG.launchPrepDay) return false;
  return CONFIG.calmEvents.includes(day.mainEvent);
}

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

export function startDay(state, days) {
  const day = getDay(days, state.day);
  if (!day) throw new Error(`days.json: no day ${state.day}`);

  const income = day.phase === 'day' ? CONFIG.incomeDay : CONFIG.incomeNight;
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

  const briefing = {
    day: day.day,
    date: day.date,
    week: day.week,
    phase: day.phase,
    tokens: Math.min(state.battery + income, CONFIG.batteryMax + income),
    comms,
    event: { type: day.mainEvent, detail: day.detail || '', donkiIds: day.donkiIds || [] },
    warnings,
    textKey: `day${day.day}`,
    eventHour: eventHourOf(day),
  };
  return { ...briefing, dilemma: makeDilemma(state, briefing) };
}

const spentOf = (a) => a.life + a.shield + a.science + (a.launch || 0);

export function validateAllocation(briefing, a) {
  const spent = spentOf(a);
  if ([a.life, a.shield, a.science, a.launch || 0].some((v) => v < 0 || !Number.isInteger(v))) return 'bad_value';
  if (a.shield > CONFIG.maxShieldTokens) return 'shield_max';
  if (a.launch && (briefing.day !== 29 || a.launch !== CONFIG.launchPrepTokens)) return 'bad_launch';
  if (spent > briefing.tokens) return 'too_many';
  return null;
}

export function resolveDay(state, days, allocation) {
  const b = state.briefing;
  const error = validateAllocation(b, allocation);
  if (error) throw new Error(`Invalid allocation: ${error}`);

  const spent = spentOf(allocation);
  const battery = Math.min(b.tokens - spent, CONFIG.batteryMax);
  const life = Math.max(0, Math.min(CONFIG.lifeMax, state.life - CONFIG.lifeDecay + allocation.life * CONFIG.lifePerToken));
  const science = state.science + allocation.science * CONFIG.sciencePerToken;

  const damage = CONFIG.background + (CONFIG.dose[b.event.type] ?? 0);
  const protection = CONFIG.shield[allocation.shield];
  const doseGain = Math.round(damage * (1 - protection) * 10) / 10;
  const dose = Math.round((state.dose + doseGain) * 10) / 10;

  let explanationKey = 'normal';
  if (damage >= 10 && allocation.shield >= 2) explanationKey = 'shield_saved';
  else if (damage >= 10) explanationKey = 'shield_weak';
  else if (life < 40) explanationKey = 'life_low';
  else if (damage <= 2 && allocation.science > 0) explanationKey = 'quiet_science';

  const result = {
    deltas: { battery: battery - state.battery, life: life - state.life, dose: doseGain, science: science - state.science },
    damage,
    protection,
    explanationKey,
    params: { percent: Math.round(protection * 100), damage, doseGain },
  };

  if (b.day === 29) result.params.launchReady = allocation.launch === CONFIG.launchPrepTokens;

  return {
    ...state,
    battery, life, dose, science,
    launchReady: state.launchReady || (b.day === 29 && allocation.launch === CONFIG.launchPrepTokens),
    result,
    lastAllocation: allocation,
    weekLog: [...state.weekLog, { day: state.day, battery, life, dose, science }],
  };
}

// 'evacuated' | 'weekComplete' | 'repeatDay' | 'launch' | 'continue'
export function checkEnd(state) {
  if (state.dose >= CONFIG.doseLimit) return 'evacuated';
  if (state.life <= 0) return 'evacuated';
  if (state.day === 29 && !state.launchReady) return 'repeatDay';
  if (state.day >= CONFIG.totalDays) return 'launch';
  if (state.day % 7 === 0 && state.day <= 28) return 'weekComplete';
  return 'continue';
}

// Вибір на екрані 'launch' (день 30)
export function resolveLaunch(state, choice) {
  const dose = choice === 'now'
    ? state.dose + CONFIG.launchNowDose
    : state.dose + CONFIG.background;
  const life = choice === 'wait' ? Math.max(0, state.life - CONFIG.launchWaitLife) : state.life;
  return { ...state, dose, life };
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
