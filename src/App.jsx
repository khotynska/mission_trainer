// Головний файл: підключає рушій до екранів. Власник: Tech Lead.
import { useReducer, useMemo, useEffect } from 'react';
import days from './data/days.json';
import { makeReducer } from './game/reducer.js';
import { createGame } from './game/gameEngine.js';
import { loadProgress, saveProgress } from './game/storage.js';
import { makeT, registerDayEvents } from './i18n/index.js';
import { mockState } from './dev/mockState.js';
import { validateDays } from './game/validateDays.js';

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
import HudButtons from './components/HudButtons.jsx';
import Tutorial from './components/Tutorial.jsx';
import BadgeToast from './components/BadgeToast.jsx';
import ChoreGame from './components/chores/ChoreGame.jsx';
import { play, setSoundEnabled } from './components/sfx.js';

registerDayEvents(days); // для запасних текстів days.events.<тип> в i18n

if (import.meta.env.DEV) {
  for (const msg of validateDays(days)) {
    if (msg.startsWith('WARN:')) console.warn(msg);
    else console.error(msg);
  }
}

const SCREENS = {
  start: Start, map: MissionMap, briefing: Briefing, decision: Decision,
  result: Result, fact: FactCard, weekComplete: WeekComplete,
  evacuation: Evacuation, launch: Launch, certificate: Certificate, sources: Sources,
};
/** Панель гри (шкали + кнопки) — над екранами дня. */
const WITH_METERS = ['briefing', 'decision', 'result'];
/** Інші ігрові екрани: лише кнопки 🔊 ☀️ 🏠 у кутку. */
const WITH_FLOAT_HUD = ['fact', 'weekComplete', 'evacuation', 'launch', 'certificate'];
/** Інструкція з Новою — на екранах із дилемою. */
const WITH_TUTORIAL = ['briefing', 'decision'];

const reducer = makeReducer(days);
function init() {
  const saved = loadProgress();
  return {
    ...createGame(saved.lang),
    patches: saved.patches,
    theme: saved.theme,
    sound: saved.sound,
    tutorialDone: saved.tutorialDone,
  };
}

export default function App() {
  // Режим попереднього перегляду: ?screen=decision  (фейковий стан, дії пишуться в консоль)
  // Міні-гра окремо (лише dev): ?chore=panels | cook | call | clean | experiment | telescope | wall | generator | games | harvest | dash | signal
  //   &v=2 — варіант (який раз граєш цю гру: інша страва, матеріал, повідомлення…)
  const params = new URLSearchParams(window.location.search);
  const preview = params.get('screen');
  const chorePreview = import.meta.env.DEV ? params.get('chore') : null;
  const choreVariant = Number(params.get('v')) || 0;
  const [realState, realDispatch] = useReducer(reducer, undefined, init);

  const state = preview ? { ...mockState, screen: preview, theme: realState.theme, sound: realState.sound } : realState;
  // У перегляді тема й звук усе одно перемикаються, щоб їх можна було перевірити на будь-якому екрані.
  const dispatch = preview
    ? (a) => (['TOGGLE_THEME', 'TOGGLE_SOUND'].includes(a.type) ? realDispatch(a) : console.log('dispatch', a))
    : realDispatch;
  const t = useMemo(() => makeT(state.lang), [state.lang]);

  useEffect(() => {
    if (!preview) saveProgress(realState);
  }, [preview, realState.patches, realState.lang, realState.theme, realState.sound, realState.tutorialDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSoundEnabled(state.sound);
  }, [state.sound]);

  // Звук кожного кліку по кнопці (кнопки з власним звуком мають data-sfx="none")
  useEffect(() => {
    const onDown = (e) => {
      const btn = e.target.closest?.('button, [role="button"]');
      if (btn && !btn.disabled && btn.dataset.sfx !== 'none') play('click');
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  if (chorePreview) {
    return (
      <div className="app" data-theme={state.theme}>
        <section className="screen day" style={{ marginTop: 16 }}>
          <ChoreGame key={`${chorePreview}-${choreVariant}`} id={chorePreview} t={t} variant={choreVariant} onDone={(r) => console.log('chore done', chorePreview, r)} />
        </section>
      </div>
    );
  }

  const Screen = SCREENS[state.screen] ?? Start;
  return (
    <div className={`app phase-${state.briefing?.phase ?? 'day'}`} data-theme={state.theme}>
      {WITH_METERS.includes(state.screen) && <Meters state={state} dispatch={dispatch} t={t} />}
      {WITH_FLOAT_HUD.includes(state.screen) && (
        <div className="hud-float no-print">
          <HudButtons state={state} dispatch={dispatch} t={t} help={false} />
        </div>
      )}
      <Screen state={state} dispatch={dispatch} t={t} />
      {state.tutorial && WITH_TUTORIAL.includes(state.screen) && <Tutorial key={state.day} state={state} dispatch={dispatch} t={t} />}
      <BadgeToast patches={state.patches} t={t} />
    </div>
  );
}
