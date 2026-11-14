// Власник: Data Engineer. Перетворює сирі дані на src/data/days.json (30 днів).
// Формат кожного дня — див. src/game/contracts.js (розділ 1).
// TODO:
//  1. Для кожної дати 2024-04-17..2024-05-16 зібрати події FLR / CME / SEP / GST.
//  2. Головна подія за пріоритетом: SEP > EXTREME (10 травня) > CME (прибуття) > X5 > X > M > QUIET.
//  3. CME, що летять до Землі (ENLIL: isEarthGB або Earth в impactList) → cmeLaunched: [{ arrivalDay }].
//  4. Кілька записів SEP за день = одна подія.
//  5. week = ceil(day / 7), дні 29–30 → week 5. phase: дні 1–14 'day', 15–28 'night', 29–30 'day'.
//  6. Записати src/data/days.json і повідомити Tech Lead, щоб він переключив імпорт в App.jsx.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export const START = '2024-04-17';
export const NUM_DAYS = 30;
const DAY_MS = 86_400_000;
export function dayIndex(isoTime) {
  return Math.round((Date.parse(isoTime.slice(0, 10)) - Date.parse(START)) / DAY_MS) + 1;
}
const dateOfDay = (day) => new Date(Date.parse(START) + (day - 1) * DAY_MS).toISOString().slice(0, 10);
const inRange = (day) => day >= 1 && day <= NUM_DAYS;
const weekOf = (day) => (day <= 28 ? Math.ceil(day / 7) : 5);
const phaseOf = (day) => (day >= 15 && day <= 28 ? 'night' : 'day');
function flareStrength(classType = '') {
  const scale = { A: 1e-8, B: 1e-7, C: 1e-6, M: 1e-5, X: 1e-4 };
  return (scale[classType[0]] ?? 0) * (parseFloat(classType.slice(1)) || 0);
}
function flareEvent(classType) {
  if (classType[0] === 'X') return parseFloat(classType.slice(1)) >= 5 ? 'X5' : 'X';
  if (classType[0] === 'M') return 'M';
  return 'QUIET';
}
function earthArrival(cme) {
  const analysis = (cme.cmeAnalyses ?? []).find((a) => a.isMostAccurate);
  if (!analysis) return null;
  const runs = [...(analysis.enlilList ?? [])].sort((a, b) =>
    (b.modelCompletionTime ?? '').localeCompare(a.modelCompletionTime ?? ''),
  );
  for (const run of runs) {
    const earthImpact = (run.impactList ?? []).find((i) => i.location === 'Earth');
    if (!run.isEarthGB && !earthImpact) continue;
    const time = run.estimatedShockArrivalTime ?? earthImpact?.arrivalTime;
    if (time) return { time, speed: analysis.speed, glancing: Boolean(run.isEarthGB || earthImpact?.isGlancingBlow) };
  }
  return null;
}
export function buildDays(raw) {
  const days = Array.from({ length: NUM_DAYS }, (_, i) => ({
    day: i + 1,
    flares: [],
    sepIds: [],
    arrivals: [],
    gst: [],
    cmeLaunched: [],
  }));
  const at = (day) => days[day - 1];
  for (const f of raw.FLR ?? []) {
    const d = dayIndex(f.peakTime ?? f.beginTime);
    if (inRange(d) && f.classType) at(d).flares.push(f);
  }
  for (const s of raw.SEP ?? []) {
    const d = dayIndex(s.eventTime);
    if (inRange(d)) at(d).sepIds.push(s.sepID);
  }
  for (const g of raw.GST ?? []) {
    const d = dayIndex(g.startTime);
    const kpMax = Math.max(0, ...(g.allKpIndex ?? []).map((k) => k.kpIndex));
    if (inRange(d)) at(d).gst.push({ gstID: g.gstID, kpMax });
  }
  for (const cme of raw.CME ?? []) {
    const hit = earthArrival(cme);
    if (!hit) continue;
    const launchDay = dayIndex(cme.startTime);
    const arrivalDay = dayIndex(hit.time);
    if (inRange(launchDay)) {
      at(launchDay).cmeLaunched.push({
        cmeId: cme.activityID,
        speedKmS: hit.speed ? Math.round(hit.speed) : null,
        arrivalDay,
        glancing: hit.glancing,
      });
    }
    if (inRange(arrivalDay)) at(arrivalDay).arrivals.push({ cmeId: cme.activityID });
  }
  return days.map((d) => {
    const flares = [...d.flares].sort((a, b) => flareStrength(b.classType) - flareStrength(a.classType));
    const top = flares[0] ?? null;
    const strongMain = flares.filter((f) => /^[MX]/.test(f.classType));
    const extremeGst = d.gst.filter((g) => g.kpMax >= 8);
    const hasSep = d.sepIds.length > 0;
    const hasArrival = d.arrivals.length > 0;
    let mainEvent = 'QUIET';
    if (hasSep) mainEvent = 'SEP';
    else if (extremeGst.length) mainEvent = 'EXTREME';
    else if (hasArrival) mainEvent = 'CME';
    else if (strongMain.length) mainEvent = flareEvent(strongMain[0].classType);
    const alsoToday = [...new Set(flares.slice(1).map((f) => f.classType))].slice(0, 3);
    const donkiIds = [
      ...d.sepIds,
      ...d.gst.map((g) => g.gstID),
      ...d.arrivals.map((a) => a.cmeId),
      ...d.cmeLaunched.map((c) => c.cmeId),
      ...(top ? [top.flrID] : []),
    ];
    return {
      day: d.day,
      date: dateOfDay(d.day),
      week: weekOf(d.day),
      phase: phaseOf(d.day),
      mainEvent,
      detail: top?.classType ?? null,
      alsoToday,
      cmeArrivals: d.arrivals.map((a) => ({ ...a, gstConfirmed: d.gst.length > 0 })),
      cmeLaunched: d.cmeLaunched,
      kpMax: Math.max(0, ...d.gst.map((g) => g.kpMax)),
      donkiIds: [...new Set(donkiIds)],
      text: { ua: '', en: '' },
      lesson: { ua: '', en: '' },
    };
  });
}
async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const rawDir = join(here, 'raw');
  const outFile = join(here, '..', 'src', 'data', 'days.json');
  const raw = {};
  for (const type of ['FLR', 'SEP', 'GST', 'CME']) {
    raw[type] = JSON.parse(await readFile(join(rawDir, `${type}.json`), 'utf8'));
  }
  const days = buildDays(raw);
  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, JSON.stringify(days, null, 2) + '\n');
  console.log('day  date        wk  phase  main     detail  also');
  for (const d of days) {
    const launched = d.cmeLaunched.length ? `  → CME to day ${d.cmeLaunched.map((c) => c.arrivalDay).join(',')}` : '';
    const confirmed = d.cmeArrivals.length ? (d.cmeArrivals[0].gstConfirmed ? '  (GST ✓)' : '  (no GST)') : '';
    console.log(
      `${String(d.day).padStart(3)}  ${d.date}  ${d.week}   ${d.phase.padEnd(5)}  ${d.mainEvent.padEnd(7)}  ${String(d.detail ?? '-').padEnd(6)}  ${d.alsoToday.join(' ')}${confirmed}${launched}`,
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