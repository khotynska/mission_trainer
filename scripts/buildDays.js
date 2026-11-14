// Власник: Data Engineer. Перетворює сирі дані на src/data/days.json (30 днів).
// Формат кожного дня — див. src/game/contracts.js (розділ 1).
// TODO:
//  1. Для кожної дати 2024-04-17..2024-05-16 зібрати події FLR / CME / SEP / GST.
//  2. Головна подія за пріоритетом: SEP > EXTREME (10 травня) > CME (прибуття) > X5 > X > M > QUIET.
//  3. CME, що летять до Землі (ENLIL: isEarthGB або Earth в impactList) → cmeLaunched: [{ arrivalDay }].
//  4. Кілька записів SEP за день = одна подія.
//  5. week = ceil(day / 7), дні 29–30 → week 5. phase: дні 1–14 'day', 15–28 'night', 29–30 'day'.
//  6. Записати src/data/days.json і повідомити Tech Lead, щоб він переключив імпорт в App.jsx.
console.log('TODO: implement buildDays');
// scripts/buildDays.js
// Turns raw DONKI data (scripts/raw/*.json from fetchDonki.js)
// into src/data/days.json — 30 game days.
//
// Run from the project root (after fetchDonki.js):
//   node scripts/buildDays.js
//
// Rules (from the game design doc):
//   - Day 1 = 2024-04-17 … day 30 = 2024-05-16 (UTC dates).
//   - Main event of the day, by priority: SEP > CME arrival > X flare > M flare > quiet.
//     SEP:      measured radiation storm near Earth/Moon (GOES, SOHO, ACE).
//               Model-only SEP forecasts (REleASE) and STEREO A are NOT counted as SEP.
//     CME:      shock at Earth (IPS, location "Earth") linked to a CME.
//     EXTREME:  CME arrival on a day with Kp >= 8 (severe geomagnetic storm).
//     X5 / X:   strongest flare of the day is X5+ / X1–X4.9.
//     M:        strongest flare of the day is M-class.
//     QUIET:    nothing above C-class.
//   - Phase: days 1–14 lunar day, 15–28 lunar night, 29–30 sunrise (counts as day).
//   - text / lesson are auto-generated drafts — Content rewrites them.

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const START = '2024-04-17';
export const NUM_DAYS = 30;

// ---------- helpers ----------

const DAY_MS = 86_400_000;

export function dayIndex(isoTime) {
  // "2024-05-11T01:23Z" -> 25  (UTC date, day 1 = START)
  const date = isoTime.slice(0, 10);
  return Math.round((Date.parse(date) - Date.parse(START)) / DAY_MS) + 1;
}

function dateOfDay(day) {
  return new Date(Date.parse(START) + (day - 1) * DAY_MS).toISOString().slice(0, 10);
}

function flareStrength(classType = '') {
  const scale = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };
  return (scale[classType[0]] ?? 0) * parseFloat(classType.slice(1) || '0');
}

function cmeStartFromId(activityID) {
  // "2024-05-10T07:12:00-CME-001" -> "2024-05-10T07:12Z"
  return activityID.slice(0, 16) + 'Z';
}

const isMeasuredSep = (sep) =>
  (sep.instruments ?? []).some((i) => /GOES|SOHO|ACE/.test(i.displayName) && !/MODEL/.test(i.displayName));
const isModelSep = (sep) => (sep.instruments ?? []).some((i) => /MODEL/.test(i.displayName));

function phaseOf(day) {
  if (day <= 14) return 'day';
  if (day <= 28) return 'night';
  return 'day'; // 29–30: sunrise
}

function weekOf(day) {
  return day <= 28 ? Math.ceil(day / 7) : 5; // 5 = departure
}

// ---------- texts (drafts for Content) ----------

const TEXT = {
  QUIET: {
    ua: 'Спокійний день. Сонце тихе, лише звичайний космічний фон.',
    en: 'A quiet day. The Sun is calm, only normal background radiation.',
  },
  M: {
    ua: (f) => `Спалах класу ${f} на Сонці. Сильний, але звичайний.`,
    en: (f) => `A class ${f} solar flare. Strong, but common.`,
  },
  X: {
    ua: (f) => `Потужний спалах класу ${f}! Завтра можливі перешкоди зв'язку.`,
    en: (f) => `A powerful class ${f} flare! Radio interference is possible tomorrow.`,
  },
  X5: {
    ua: (f) => `Екстремальний спалах класу ${f}! Один із найсильніших за роки.`,
    en: (f) => `An extreme class ${f} flare! One of the strongest in years.`,
  },
  CME: {
    ua: 'Хмара сонячної плазми (CME) дісталася Місяця.',
    en: 'A cloud of solar plasma (CME) has reached the Moon.',
  },
  EXTREME: {
    ua: 'Найсильніший удар сонячної плазми за ~20 років накрив Землю й Місяць!',
    en: 'The strongest solar plasma hit in ~20 years has struck Earth and the Moon!',
  },
  SEP: {
    ua: 'Радіаційна буря! Сонце розігнало частинки майже до швидкості світла.',
    en: 'Radiation storm! The Sun has accelerated particles to nearly the speed of light.',
  },
};

const LESSON = {
  QUIET: {
    ua: 'Навіть у спокійний день на Місяці є космічне випромінювання: тут немає атмосфери, яка б захищала.',
    en: 'Even on a quiet day there is cosmic radiation on the Moon: there is no atmosphere to protect you.',
  },
  M: {
    ua: 'Спалахи класу M трапляються часто. Світло від них долітає до Місяця приблизно за 8 хвилин.',
    en: 'M-class flares are common. Their light reaches the Moon in about 8 minutes.',
  },
  X: {
    ua: 'Спалахи класу X — найсильніші. Вони можуть порушити радіозв\'язок.',
    en: 'X-class flares are the strongest kind. They can disrupt radio communication.',
  },
  X5: {
    ua: 'Кожен наступний клас спалахів у 10 разів сильніший: X у 10 разів потужніший за M.',
    en: 'Each flare class is 10 times stronger than the one before: X is 10 times stronger than M.',
  },
  CME: {
    ua: 'CME летить від Сонця 1–4 дні, тому вчені можуть попередити астронавтів заздалегідь.',
    en: 'A CME takes 1–4 days to travel from the Sun, so scientists can warn astronauts in advance.',
  },
  EXTREME: {
    ua: 'Землю захищає магнітне поле, тому люди бачили полярне сяйво. У Місяця такого захисту немає.',
    en: 'Earth\'s magnetic field protects it, so people saw auroras. The Moon has no such shield.',
  },
  SEP: {
    ua: 'Під час радіаційної бурі астронавти ховаються в найзахищенішу частину бази.',
    en: 'During radiation storms, astronauts shelter in the best-protected part of the base.',
  },
};

const pick = (entry, lang, flare) => (typeof entry[lang] === 'function' ? entry[lang](flare) : entry[lang]);

// ---------- main logic (pure: raw data in, days out) ----------

export function buildDays(raw) {
  const days = Array.from({ length: NUM_DAYS }, (_, i) => ({
    day: i + 1,
    date: dateOfDay(i + 1),
    week: weekOf(i + 1),
    phase: phaseOf(i + 1),
    flares: [],
    sep: [],
    sepForecast: [],
    arrivals: [],
    kpMax: 0,
    gstIds: [],
    cmeLaunched: [],
  }));
  const inRange = (d) => d >= 1 && d <= NUM_DAYS;

  // Flares (M and X only)
  for (const f of raw.FLR ?? []) {
    if (!/^[MX]/.test(f.classType ?? '')) continue;
    const d = dayIndex(f.peakTime ?? f.beginTime);
    if (inRange(d)) days[d - 1].flares.push(f);
  }

  // SEP: measured vs model-only
  for (const s of raw.SEP ?? []) {
    const d = dayIndex(s.eventTime);
    if (!inRange(d)) continue;
    if (isMeasuredSep(s)) days[d - 1].sep.push(s);
    else if (isModelSep(s)) days[d - 1].sepForecast.push(s);
  }

  // Geomagnetic storms: max Kp per day
  for (const g of raw.GST ?? []) {
    for (const k of g.allKpIndex ?? []) {
      const d = dayIndex(k.observedTime);
      if (!inRange(d)) continue;
      days[d - 1].kpMax = Math.max(days[d - 1].kpMax, k.kpIndex);
      if (!days[d - 1].gstIds.includes(g.gstID)) days[d - 1].gstIds.push(g.gstID);
    }
  }

  // CME speeds by id (from CME catalog, most accurate analysis)
  const cmeSpeed = {};
  for (const c of raw.CME ?? []) {
    const a = (c.cmeAnalyses ?? []).find((x) => x.isMostAccurate) ?? (c.cmeAnalyses ?? [])[0];
    if (a) cmeSpeed[c.activityID] = Math.round(a.speed);
  }

  // CME arrivals = shocks at Earth linked to a CME
  for (const ips of raw.IPS ?? []) {
    if (ips.location !== 'Earth') continue;
    const cmeIds = (ips.linkedEvents ?? []).map((l) => l.activityID).filter((id) => id.includes('-CME-'));
    if (cmeIds.length === 0) continue;
    const arrivalDay = dayIndex(ips.eventTime);
    if (!inRange(arrivalDay)) continue;
    days[arrivalDay - 1].arrivals.push({ ipsId: ips.activityID, time: ips.eventTime, cmeIds });

    // Mark launch day of each linked CME, so the game can warn in advance
    for (const id of cmeIds) {
      const launchDay = dayIndex(cmeStartFromId(id));
      if (!inRange(launchDay)) continue; // launched before day 1
      days[launchDay - 1].cmeLaunched.push({
        cmeId: id,
        speedKmS: cmeSpeed[id] ?? null,
        arrivalDay,
      });
    }
  }

  // Build final records
  return days.map((d) => {
    d.flares.sort((a, b) => flareStrength(b.classType) - flareStrength(a.classType));
    const top = d.flares[0];
    const topClass = top?.classType ?? null;
    const xFlares = d.flares.filter((f) => f.classType[0] === 'X');

    const hasArrival = d.arrivals.length > 0;
    const extreme = hasArrival && d.kpMax >= 8;

    let mainEvent = 'QUIET';
    if (d.sep.length) mainEvent = 'SEP';
    else if (extreme) mainEvent = 'EXTREME';
    else if (hasArrival) mainEvent = 'CME';
    else if (topClass?.[0] === 'X') mainEvent = parseFloat(topClass.slice(1)) >= 5 ? 'X5' : 'X';
    else if (topClass?.[0] === 'M') mainEvent = 'M';

    // Everything else notable that also happened today
    const alsoToday = [];
    if (xFlares.length) alsoToday.push(...xFlares.map((f) => f.classType));
    else if (topClass && mainEvent !== 'M') alsoToday.push(topClass);
    if (extreme && mainEvent !== 'EXTREME') alsoToday.push('EXTREME');
    else if (hasArrival && !['CME', 'EXTREME'].includes(mainEvent)) alsoToday.push('CME');
    if (d.sepForecast.length && !d.sep.length) alsoToday.push('SEP_FORECAST');

    // DONKI ids for the "Real event · NASA DONKI · ID" line
    const donkiIds = [
      ...new Set([
        ...d.sep.map((s) => s.sepID),
        ...d.arrivals.map((a) => a.ipsId),
        ...xFlares.map((f) => f.flrID),
        ...(xFlares.length === 0 && top ? [top.flrID] : []),
        ...(extreme ? d.gstIds : []),
      ]),
    ];

    const flareForText = ['X', 'X5'].includes(mainEvent) || mainEvent === 'M' ? topClass : null;

    return {
      day: d.day,
      date: d.date,
      week: d.week,
      phase: d.phase,
      mainEvent,
      alsoToday,
      strongestFlare: topClass,
      flareCount: { M: d.flares.length - xFlares.length, X: xFlares.length },
      kpMax: d.kpMax,
      cmeArrivals: d.arrivals.map((a) => ({ time: a.time, cmeIds: a.cmeIds })),
      cmeLaunched: d.cmeLaunched,
      donkiIds,
      text: { ua: pick(TEXT[mainEvent], 'ua', flareForText), en: pick(TEXT[mainEvent], 'en', flareForText) },
      lesson: { ua: LESSON[mainEvent].ua, en: LESSON[mainEvent].en },
    };
  });
}

// ---------- CLI ----------

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const rawDir = join(here, 'raw');
  const outFile = join(here, '..', 'src', 'data', 'days.json');

  const raw = {};
  for (const type of ['FLR', 'SEP', 'GST', 'IPS', 'CME']) {
    raw[type] = JSON.parse(await readFile(join(rawDir, `${type}.json`), 'utf8'));
  }

  const days = buildDays(raw);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(days, null, 2) + '\n');

  console.log('day  date        phase  main     also');
  for (const d of days) {
    const launched = d.cmeLaunched.length ? `  → CME arrives day ${d.cmeLaunched.map((c) => c.arrivalDay).join(',')}` : '';
    console.log(
      `${String(d.day).padStart(3)}  ${d.date}  ${d.phase.padEnd(5)}  ${d.mainEvent.padEnd(7)}  ${d.alsoToday.join(' ')}${launched}`,
    );
  }
  console.log(`\n✓ ${days.length} days → src/data/days.json`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('✗', err.message);
    process.exit(1);
  });
}