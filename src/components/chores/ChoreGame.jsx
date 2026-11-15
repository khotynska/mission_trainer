// Міні-гра для справи чи рішення: у кожної своя механіка.
// 🍅 торкатися · 🍲 перетягувати в каструлю · 📞 набирати номер · 🧹 сортувати по кошиках ·
// 🔬 тримати бур · 🔭 шукати лупою · 🔋 крутити ручку · 🎲 шукати пари.
// Великі ігри з MoonShift (сцена 960×600): 🧽 «Протри панелі» · 🧱 «Збудуй стіну» · 🏃 «Біжи в укриття» · 📡 «Налаштуй зв'язок».
// variant — скільки разів гравець уже грав цю гру: щоразу інший набір продуктів, страва, матеріал, повідомлення…
// onDone({ success, score }) — результат іде в CHOOSE і може змінити наслідки дня (див. withGameResult у reducer.js).
import { useEffect, useRef } from 'react';
import Harvest from './Harvest.jsx';
import Pot from './Pot.jsx';
import Dial from './Dial.jsx';
import Sort from './Sort.jsx';
import Drill from './Drill.jsx';
import Lens from './Lens.jsx';
import Crank from './Crank.jsx';
import Memory from './Memory.jsx';
import PanelPatrol from './big/PanelPatrol.jsx';
import BrickBuilder from './big/BrickBuilder.jsx';
import ShelterDash from './big/ShelterDash.jsx';
import SignalTune from './big/SignalTune.jsx';
import '../../styles/chores.css';

const GAMES = {
  harvest: Harvest,
  panels: PanelPatrol,
  cook: Pot,
  call: Dial,
  clean: Sort,
  experiment: Drill,
  telescope: Lens,
  wall: BrickBuilder,
  generator: Crank,
  games: Memory,
  dash: ShelterDash,
  signal: SignalTune,
};

const DONE = Object.freeze({ success: true, score: 1 });

export default function ChoreGame({ id, t, variant = 0, onDone }) {
  const Game = GAMES[id] ?? Harvest;
  // Ігри завершуються з короткою паузою; якщо за цей час гравець пішов (напр. на мапу), результат не надсилаємо.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const done = (result) => {
    if (alive.current) onDone(result && typeof result === 'object' ? result : DONE);
  };
  return <Game t={t} variant={variant} onDone={done} />;
}
