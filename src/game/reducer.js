// Переходи між екранами + виклики рушія. Власник: Tech Lead.
import { ACTIONS } from './contracts.js';
import { createGame, startDay, resolveDay, resolveLaunch, checkEnd, checkWeekGoal } from './gameEngine.js';
import { CONFIG } from './config.js';
import { registerDayEvents } from '../i18n/index.js';

const snapshot = (s) => ({ day: s.day, battery: s.battery, life: s.life, dose: s.dose, science: s.science, launchReady: s.launchReady });

function beginDay(state, days) {
  const isWeekStart = (state.day - 1) % 7 === 0;
  const withSnap = isWeekStart || !state.weekSnapshot
    ? { ...state, weekSnapshot: snapshot(state), weekLog: [] }
    : state;
  return { ...withSnap, briefing: startDay(withSnap, days), result: null, screen: 'briefing' };
}

const evacuate = (s) => ({ ...s, screen: 'evacuation', endReason: s.dose >= CONFIG.doseLimit ? 'dose' : 'life' });

// Якщо даних на наступний день ще немає (напр. фейкові 3 дні) — завершуємо гру сертифікатом.
function nextDay(state, days) {
  if (!days.some((d) => d.day === state.day + 1)) return { ...state, screen: 'certificate' };
  return beginDay({ ...state, day: state.day + 1 }, days);
}

export function makeReducer(days) {
  registerDayEvents(days); // для запасних текстів days.events.<тип> в i18n
  return function reducer(state, action) {
    switch (action.type) {
      case ACTIONS.START_GAME:
        return beginDay({ ...createGame(state.lang), patches: state.patches }, days);

      case ACTIONS.OPEN_DECISION:
        return { ...state, screen: 'decision' };

      case ACTIONS.SUBMIT_ALLOCATION:
        return { ...resolveDay(state, days, action.allocation), screen: 'result' };

      case ACTIONS.NEXT: {
        if (state.screen === 'result') return { ...state, screen: 'fact' };
        if (state.screen === 'fact') {
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
        if (state.screen === 'weekComplete') return nextDay(state, days);
        return state;
      }

      case ACTIONS.RESTART_WEEK: {
        const s = state.weekSnapshot;
        if (!s) return state;
        return beginDay({ ...state, ...s, weekLog: [], endReason: null }, days);
      }

      case ACTIONS.LAUNCH_CHOICE: {
        const s = resolveLaunch(state, action.choice);
        if (s.dose >= CONFIG.doseLimit || s.life <= 0) return evacuate(s);
        return { ...s, screen: 'certificate' };
      }

      case ACTIONS.TOGGLE_TIMER:
        return { ...state, timerOn: !state.timerOn };

      case ACTIONS.GO:
        return { ...state, screen: action.screen };

      case ACTIONS.SET_LANG:
        return { ...state, lang: action.lang };

      default:
        return state;
    }
  };
}
