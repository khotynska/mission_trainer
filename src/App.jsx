// Головний файл: підключає рушій до екранів. Власник: Tech Lead.
import { useReducer, useMemo, useEffect } from 'react';
import days from './data/days.mock.json'; // ← коли Data готовий: './data/days.json'
import { makeReducer } from './game/reducer.js';
import { createGame } from './game/gameEngine.js';
import { loadProgress, saveProgress } from './game/storage.js';
import { makeT } from './i18n/index.js';
import { mockState } from './dev/mockState.js';

import Start from './components/Start.jsx';
import MissionMap from './components/MissionMap.jsx';
import Briefing from './components/Briefing.jsx';
import Decision from './components/Decision.jsx';
import Result from './components/Result.jsx';
import FactCard from './components/FactCard.jsx';
import WeekComplete from './components/WeekComplete.jsx';
import Evacuation from './components/Evacuation.jsx';
import Certificate from './components/Certificate.jsx';
import Launch from './components/Launch.jsx';
import Sources from './components/Sources.jsx';
import Meters from './components/Meters.jsx';

const SCREENS = {
  start: Start, map: MissionMap, briefing: Briefing, decision: Decision,
  result: Result, fact: FactCard, weekComplete: WeekComplete,
  evacuation: Evacuation, launch: Launch, certificate: Certificate, sources: Sources,
};
const WITH_METERS = ['briefing', 'decision', 'result'];

const reducer = makeReducer(days);
function init() {
  const saved = loadProgress();
  return { ...createGame(saved.lang), patches: saved.patches };
}

export default function App() {
  // Режим попереднього перегляду: ?screen=decision  (фейковий стан, дії пишуться в консоль)
  const preview = new URLSearchParams(window.location.search).get('screen');
  const [realState, realDispatch] = useReducer(reducer, undefined, init);

  const state = preview ? { ...mockState, screen: preview } : realState;
  const dispatch = preview ? (a) => console.log('dispatch', a) : realDispatch;
  const t = useMemo(() => makeT(state.lang), [state.lang]);

  useEffect(() => {
    if (!preview) saveProgress(realState);
  }, [preview, realState.patches, realState.lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const Screen = SCREENS[state.screen] ?? Start;
  return (
    <div className={`app phase-${state.briefing?.phase ?? 'day'}`}>
      {WITH_METERS.includes(state.screen) && <Meters state={state} dispatch={dispatch} t={t} />}
      <Screen state={state} dispatch={dispatch} t={t} />
    </div>
  );
}
