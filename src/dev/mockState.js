// Фейковий стан для розробки екранів окремо: http://localhost:5173/?screen=decision
// Відповідає контрактам у src/game/contracts.js. Змінює Tech Lead разом із контрактами.
import days from '../data/days.json';
import { buildLevel } from '../game/levels.js';

const base = { day: 25, battery: 6, life: 70, mood: 55, dose: 34, science: 85, wall: 1 };
const day = days[base.day - 1];

const briefing = {
  day: 25,
  date: '2024-05-11',
  week: 4,
  phase: 'night',
  comms: true,
  event: { type: 'SEP', detail: 'X5.8', donkiIds: ['2024-05-11T02:10:00-SEP-001', '2024-05-11T01:10:00-FLR-001'] },
  warnings: [{ type: 'CME', inDays: 2 }],
  textKey: 'day25',
  eventHour: 2.17,
  level: buildLevel(base, day),
};

export const mockState = {
  screen: 'briefing',
  ...base,
  patches: ['energy', 'science', 'first_steps', 'shelter_pro'],
  lang: 'ua',
  briefing,
  result: {
    choiceDeltas: { battery: 0, life: 0, mood: -5, science: 0, dose: 2, wall: 0 },
    dailyDeltas: { battery: 0, life: -5, dose: 1 },
    deltas: { battery: 0, life: -5, mood: -5, science: 0, dose: 3 },
    cold: false,
    notes: ['wall'],
    choice: { option: 0, id: 'deep', kind: 'storm', chore: false, best: true, timedOut: false, fast: true },
    mood: 'happy',
  },
  weekSnapshot: { day: 22, battery: 10, life: 80, mood: 70, dose: 30, science: 85, wall: 1 },
  weekLog: [],
  endReason: 'dose',
  timerOn: true,
  lastWeekResult: { week: 3, passed: true, patch: 'night' },
  launchReady: false,
  theme: 'dark',
  sound: true,
  tutorial: false,
  tutorialDone: true,
  daySnapshot: { ...base },
  history: [
    { day: 20, date: '2024-05-06', event: 'CME', choice: 'shelter', best: true, doseGain: 2, stars: 3, snap: null },
    { day: 22, date: '2024-05-08', event: 'X', choice: 'lab', best: true, doseGain: 1, stars: 3, snap: null },
    { day: 23, date: '2024-05-09', event: 'SEP', choice: 'boxes', best: false, doseGain: 16, stars: 1, snap: null },
    { day: 24, date: '2024-05-10', event: 'SEP', choice: 'wait', best: true, doseGain: 3, stars: 3, snap: null },
  ],
  stats: { sheltered: 3, fast: 2 },
  resume: 'briefing',
};
