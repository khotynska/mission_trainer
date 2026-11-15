// Симулятор балансу. Проганяє 30 справжніх днів (src/data/days.json) кількома стратегіями вибору
// через справжній редюсер гри й друкує, чим закінчилася місія.
// Власник: Data Engineer. Числа балансу — лише в src/game/config.js, рівні — у src/game/levels.js.
//
// Запуск: node scripts/simulate.js        (додай -v, щоб побачити кожен день найкращої стратегії)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { makeReducer } from '../src/game/reducer.js';
import { createGame, getRank } from '../src/game/gameEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const days = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/days.json'), 'utf-8'));
const reducer = makeReducer(days);
const verbose = process.argv.includes('-v');

const fx = (o) => Object.entries(o.fx).map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`).join(' ') || '—';

/** strategy(state, level) → індекс варіанта; launch — 'now' | 'wait'. */
function play(name, strategy, launch = 'wait', show = false) {
  let s = reducer({ ...createGame('ua'), patches: [], tutorialDone: true }, { type: 'START_GAME' });
  s = reducer(s, { type: 'GO', screen: 'briefing' });
  const log = [];
  let retries = 0;
  for (let step = 0; step < 400; step++) {
    if (s.screen === 'briefing') {
      const lv = s.briefing.level;
      const ok = lv.options.map((o, i) => (o.affordable ? i : -1)).filter((i) => i >= 0);
      let pick = strategy(s, lv);
      if (!lv.options[pick]?.affordable) pick = ok[0];
      if (show) log.push(`d${s.day} ${s.briefing.event.type} [${lv.kind}] ${lv.options.map((o, i) => `${i === pick ? '*' : ''}${o.id}(${fx(o)})${o.affordable ? '' : '✗'}`).join(' | ')}`);
      s = reducer(s, { type: 'CHOOSE', option: pick, ms: 3000 });
      if (show) log.push(`    → ⚡${s.battery} 🫁${s.life} 😊${s.mood} ☢️${s.dose} 🔬${s.science} 🧱${s.wall}${s.result.cold ? ' (холодно)' : ''}`);
    } else if (s.screen === 'result') s = reducer(s, { type: 'NEXT' });
    else if (s.screen === 'weekComplete') {
      if (show) log.push(`  ТИЖДЕНЬ ${s.lastWeekResult.week}: ${s.lastWeekResult.passed ? 'нашивка ✓' : 'без нашивки'}`);
      s = reducer(s, { type: 'NEXT' });
    } else if (s.screen === 'launch') s = reducer(s, { type: 'LAUNCH_CHOICE', choice: launch });
    else if (s.screen === 'evacuation') {
      if (show) log.push(`  ЕВАКУАЦІЯ: день ${s.day}, ${s.endReason}`);
      if (++retries > 2) break;
      s = reducer(s, { type: 'RETRY_DAY' });
    } else break;
  }
  const end = s.screen === 'certificate' ? `сертифікат ${getRank(s)}` : `${s.screen} на дні ${s.day}`;
  console.log(`${name.padEnd(12)} ${end.padEnd(22)} ⚡${s.battery} 🫁${s.life} 😊${s.mood} ☢️${s.dose} 🔬${s.science} | ${s.patches.join(',')}`);
  if (show) console.log(log.join('\n'));
}

const safe = (s, lv) => (lv.best >= 0 ? lv.best : 0);
const pickBy = (key) => (s, lv) => {
  const score = lv.options.map((o) => (o.affordable ? (o.fx[key] ?? 0) - (o.fx.dose ?? 0) * 3 : -999));
  return score.indexOf(Math.max(...score));
};
// «Розумна дитина»: ховається від бурі; у справах обирає те, чого зараз найменше.
const smart = (s, lv) => {
  if (lv.best >= 0) return lv.best;
  const need = ['life', 'mood', 'battery', 'science'].map((k) => [k, s[k] / ({ life: 100, mood: 100, battery: 12, science: 150 }[k])]).sort((a, b) => a[1] - b[1]);
  for (const [k] of need) {
    const i = lv.options.findIndex((o) => o.affordable && (o.fx[k] ?? 0) > 0);
    if (i >= 0) return i;
  }
  return 0;
};
const risky = (s, lv) => (lv.best >= 0 ? 1 - lv.best : 1);
const sciencey = pickBy('science');
let seed = 11;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

play('розумна', smart, 'wait', verbose);
play('завжди-1', safe);
play('наука', sciencey);
play('ризик', risky);
play('друга-кнопка', () => 1);
for (let i = 0; i < 4; i++) play(`випадково${i}`, () => (rnd() < 0.5 ? 0 : 1), rnd() < 0.5 ? 'now' : 'wait');
