// Фейковий стан для розробки екранів окремо: http://localhost:5173/?screen=decision
// Відповідає контрактам у src/game/contracts.js. Змінює Tech Lead разом із контрактами.
import { makeDilemma } from '../game/dilemmas.js';

const base = {
  screen: 'briefing',
  day: 25,
  battery: 6,
  life: 70,
  dose: 34,
  science: 85,
};

const briefing = {
  day: 25,
  date: '2024-05-11',
  week: 4,
  phase: 'night',
  tokens: 8,
  comms: true,
  event: { type: 'SEP', detail: 'X5.8', donkiIds: ['2024-05-11T02:10:00-SEP-001', '2024-05-11T01:10:00-FLR-001'] },
  warnings: [{ type: 'CME', inDays: 2 }],
  textKey: 'day25',
  eventHour: 2.17,
};

export const mockState = {
  ...base,
  patches: ['energy', 'science', 'first_steps', 'shelter_pro'],
  lang: 'ua',
  briefing: { ...briefing, dilemma: makeDilemma(base, briefing) },
  result: {
    deltas: { battery: -3, life: -10, dose: 2.6, science: 0 },
    damage: 26,
    protection: 0.9,
    explanationKey: 'shield_saved',
    params: { percent: 90, damage: 26, doseGain: 2.6 },
    choice: { option: 0, id: 'shelter', kind: 'storm', best: true, timedOut: false, fast: true },
    mood: 'happy',
  },
  lastAllocation: { life: 0, shield: 3, science: 0 },
  weekSnapshot: { day: 22, battery: 10, life: 80, dose: 30, science: 85 },
  weekLog: [],
  endReason: 'dose',
  timerOn: true,
  lastWeekResult: { week: 3, passed: true, patch: 'night' },
  launchReady: false,
  theme: 'dark',
  sound: true,
  tutorial: false,
  tutorialDone: true,
  daySnapshot: { day: 25, battery: 6, life: 70, dose: 34, science: 85 },
  history: [
    { day: 20, date: '2024-05-06', event: 'CME', choice: 'shelter', best: true, doseGain: 1.1, snap: null },
    { day: 22, date: '2024-05-08', event: 'X', choice: 'science', best: false, doseGain: 6, snap: null },
    { day: 23, date: '2024-05-09', event: 'SEP', choice: 'science', best: false, doseGain: 26, snap: null },
    { day: 24, date: '2024-05-10', event: 'SEP', choice: 'shelter', best: true, doseGain: 2.6, snap: null },
  ],
  calmLog: [
    { day: 11, date: '2024-04-27', phase: 'day', event: 'M', detail: 'M3.0', warnings: [], deltas: { battery: 0, life: 0, dose: 1.5, science: 15 } },
    { day: 12, date: '2024-04-28', phase: 'day', event: 'QUIET', detail: '', warnings: [], deltas: { battery: 0, life: 0, dose: 1, science: 15 } },
    { day: 13, date: '2024-04-29', phase: 'day', event: 'M', detail: 'M3.7', warnings: [{ type: 'CME', inDays: 2 }], deltas: { battery: 0, life: 0, dose: 1.5, science: 15 } },
  ],
  stats: { sheltered: 3, fast: 2 },
  resume: null,
};
