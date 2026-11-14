// Симулятор балансу. Проганяє days.json (або, поки його нема, days.mock.json)
// чотирма стратегіями розподілу жетонів і друкує результат по тижнях.
// Власник: Data Engineer. Числа балансу крутити лише в src/game/config.js.
//
// Примітка: makeReducer() з src/game/reducer.js тут НЕ використовується — він
// імпортує src/i18n/index.js, а той читає переклади через import.meta.glob,
// що існує лише в Vite (у браузері) і падає під звичайним `node`. Тож цей
// скрипт дублює той самий цикл дня напряму через чисті функції gameEngine.js
// (без текстів і без React — симулятору вони й не потрібні).
//
// Запуск: node scripts/simulate.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { CONFIG } from '../src/game/config.js';
import {
  createGame,
  startDay,
  resolveDay,
  resolveLaunch,
  checkEnd,
  checkWeekGoal,
  getRank,
} from '../src/game/gameEngine.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
function loadDays() {
  const realPath = path.join(__dirname, '../src/data/days.json');
  const mockPath = path.join(__dirname, '../src/data/days.mock.json');
  if (fs.existsSync(realPath)) {
    const days = JSON.parse(fs.readFileSync(realPath, 'utf-8'));
    if (days.length >= 30) return days;
    console.warn(`⚠️  src/data/days.json має лише ${days.length} днів (треба 30) — лечу на days.mock.json.`);
  } else {
    console.warn('⚠️  src/data/days.json ще нема — лечу на days.mock.json (кілька фейкових днів).');
    console.warn('    Запусти scripts/buildDays.js, коли реальні дані будуть готові.');
  }
  return JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
}
const snapshot = (s) => ({ day: s.day, battery: s.battery, life: s.life, dose: s.dose, science: s.science, launchReady: s.launchReady });
function beginDay(state, days) {
  const isWeekStart = (state.day - 1) % 7 === 0;
  const withSnap = isWeekStart || !state.weekSnapshot
    ? { ...state, weekSnapshot: snapshot(state), weekLog: [] }
    : state;
  return { ...withSnap, briefing: startDay(withSnap, days), result: null, screen: 'briefing' };
}
const evacuate = (s) => ({ ...s, screen: 'evacuation', endReason: s.dose >= CONFIG.doseLimit ? 'dose' : 'life' });
function nextDay(state, days) {
  if (!days.some((d) => d.day === state.day + 1)) return { ...state, screen: 'certificate' };
  return beginDay({ ...state, day: state.day + 1 }, days);
}
function advanceAfterDay(state, days) {
  const end = checkEnd(state);
  if (end === 'evacuated') return evacuate(state);
  if (end === 'repeatDay') return beginDay(state, days); // день 29 без підготовки ракети
  if (end === 'launch') return { ...state, screen: 'launch' };
  if (end === 'weekComplete') {
    const weekResult = checkWeekGoal(state);
    const { patch } = weekResult;
    const patches = patch && !state.patches.includes(patch) ? [...state.patches, patch] : state.patches;
    return { ...state, patches, lastWeekResult: weekResult, screen: 'weekComplete' };
  }
  return nextDay(state, days);
}
const isDangerous = (eventType) => CONFIG.background + (CONFIG.dose[eventType] ?? 0) >= 10;
function clampAllocation({ life, shield, science }, tokens) {
  life = Math.max(0, life);
  shield = Math.min(CONFIG.maxShieldTokens, Math.max(0, shield));
  science = Math.max(0, science);
  let spent = life + shield + science;
  while (spent > tokens && science > 0) { science -= 1; spent -= 1; }
  while (spent > tokens && shield > 0) { shield -= 1; spent -= 1; }
  while (spent > tokens && life > 0) { life -= 1; spent -= 1; }
  return { life, shield, science };
}
const STRATEGIES = {
  allScience: (briefing) => ({ life: 1, shield: 0, science: Math.max(0, briefing.tokens - 1) }),
    allShield: () => ({ life: 1, shield: CONFIG.maxShieldTokens, science: 0 }),
  balanced: (briefing) => {
    const life = 1;
    const shield = isDangerous(briefing.event.type) ? 2 : 0;
    const rest = Math.max(0, briefing.tokens - life - shield);
    const science = briefing.phase === 'day' ? Math.ceil(rest / 2) : rest;
    return { life, shield, science };
  },
    random: (briefing) => {
    const life = Math.floor(Math.random() * 3);
    const shieldBudget = Math.min(CONFIG.maxShieldTokens, Math.max(0, briefing.tokens - life));
    const shield = Math.floor(Math.random() * (shieldBudget + 1));
    const rest = Math.max(0, briefing.tokens - life - shield);
    const science = Math.floor(Math.random() * (rest + 1));
    return { life, shield, science };
  },
};

function buildAllocation(strategyFn, briefing, state) {
  if (briefing.day === 29 && briefing.tokens >= CONFIG.launchPrepTokens) {
    const rest = briefing.tokens - CONFIG.launchPrepTokens;
    const base = clampAllocation(strategyFn({ ...briefing, tokens: rest }, state), rest);
    return { ...base, launch: CONFIG.launchPrepTokens };
  }
  return clampAllocation(strategyFn(briefing, state), briefing.tokens);
}
function runStrategy(name, strategyFn, days) {
  let state = beginDay({ ...createGame('ua'), patches: [] }, days);
  console.log(`\n=== Стратегія: ${name} ===`);
  const MAX_STEPS = 400; // запобіжник: день 29 може повторитись, якщо бракує жетонів на ракету
  for (let step = 0; step < MAX_STEPS; step += 1) {
    switch (state.screen) {
      case 'briefing': {
        const allocation = buildAllocation(strategyFn, state.briefing, state);
        state = { ...resolveDay(state, days, allocation), screen: 'result' };
        break;
      }
      case 'result': {
        state = { ...state, screen: 'fact' };
        break;
      }
      case 'fact': {
        state = advanceAfterDay(state, days);
        break;
      }
      case 'weekComplete': {
        const r = state.lastWeekResult;
        console.log(
          `  Тиждень ${r.week}: ${r.passed ? `✅ нашивка "${r.patch}"` : '❌ без нашивки'}` +
          ` | батарея=${state.battery} життя=${Math.round(state.life)}` +
          ` доза=${Math.round(state.dose * 10) / 10} наука=${state.science}`,
        );
        state = nextDay(state, days);
        break;
      }
      case 'launch': {
        const choice = name === 'allShield' ? 'wait' : 'now';
        const launched = resolveLaunch(state, choice);
        state = (launched.dose >= CONFIG.doseLimit || launched.life <= 0) ? evacuate(launched) : { ...launched, screen: 'certificate' };
        break;
      }
      case 'evacuation': {
        const reason = state.endReason === 'dose' ? 'доза радіації' : 'життєзабезпечення';
        console.log(`  💥 Евакуація на дні ${state.day} (причина: ${reason}) | наука=${state.science} доза=${Math.round(state.dose * 10) / 10}`);
        return { outcome: 'evacuated', day: state.day, science: state.science, dose: state.dose };
      }
      case 'certificate': {
        const rank = getRank(state);
        console.log(
          `  🏁 Результат: наука=${state.science} доза=${Math.round(state.dose * 10) / 10}` +
          ` життя=${Math.round(state.life)} ранг=${rank ?? '—'}`,
        );
        return { outcome: 'certificate', science: state.science, dose: state.dose, life: state.life, rank };
      }
      default: {
        console.log(`  (!) Невідомий екран "${state.screen}" на дні ${state.day} — зупиняю стратегію.`);
        return { outcome: 'stuck', day: state.day, screen: state.screen };
      }
    }
  }
  console.log('  (!) Забагато кроків — ймовірно зациклення на дні 29 (бракує жетонів на ракету).');
  return { outcome: 'stuck-loop', day: state.day };
}
function main() {
  const days = loadDays();
  const results = {};
  for (const [name, strategyFn] of Object.entries(STRATEGIES)) {
    results[name] = runStrategy(name, strategyFn, days);
  }
  console.log('\n=== Підсумок усіх стратегій ===');
  for (const [name, r] of Object.entries(results)) {
    console.log(`  ${name.padEnd(10)} -> ${JSON.stringify(r)}`);
  }
}
main();
