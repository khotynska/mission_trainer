// 🔭 Подивитися в телескоп: води лупою по нічному небу й знайди 3 сховані цілі. Щоразу інші: зорі, планети, комета, галактика.
// Торкнись будь-де — лупа перескочить туди; стрілки на клавіатурі теж рухають лупу.
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { capture, useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const VARIANTS = [
  { key: 'stars', targets: [[22, 30, '⭐'], [74, 22, '🌟'], [58, 72, '✨']] },
  { key: 'planets', targets: [[16, 66, '🔴'], [48, 24, '🪐'], [82, 58, '🌍']] },
  { key: 'comet', targets: [[70, 30, '☄️'], [26, 22, '🌠'], [40, 74, '💫']] },
  { key: 'galaxy', targets: [[80, 76, '🌌'], [20, 44, '⭐'], [58, 18, '✨']] },
];
const FIND_RADIUS = 14; // у % ширини поля
const STEP = 8;

export default function Lens({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const STARS = v.targets.map(([x, y, emoji], i) => ({ id: String(i), x, y, emoji }));
  const [lens, setLens] = useState({ x: 50, y: 50 });
  const [found, setFound] = useState([]);
  const field = useRef(null);
  const foundRef = useRef([]);
  const dragging = useRef(false);
  const [done, finish] = useFinish(onDone);

  const look = (x, y) => {
    setLens({ x, y });
    const hit = STARS.find((s) => !foundRef.current.includes(s.id) && Math.hypot(s.x - x, (s.y - y) * 0.6) < FIND_RADIUS);
    if (!hit) return;
    play('select');
    const next = [...foundRef.current, hit.id];
    foundRef.current = next;
    setFound(next);
    if (next.length === STARS.length) finish();
  };

  const lookAt = (e) => {
    const r = field.current.getBoundingClientRect();
    look(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };

  const onKey = (e) => {
    const d = { ArrowLeft: [-STEP, 0], ArrowRight: [STEP, 0], ArrowUp: [0, -STEP], ArrowDown: [0, STEP] }[e.key];
    if (!d) return;
    e.preventDefault();
    look(Math.min(100, Math.max(0, lens.x + d[0])), Math.min(100, Math.max(0, lens.y + d[1])));
  };

  return (
    <GameShell icon="🔭" title={t(`levels.chore.telescope.v.${v.key}`)} t={t} done={done}
      progress={found.length / STARS.length} label={t('decision.task_progress', { n: found.length, total: STARS.length })}
      fieldProps={{
        ref: field,
        className: 'mg__field--sky',
        tabIndex: 0,
        role: 'application',
        'aria-label': t('decision.mg.lens_hint'),
        onKeyDown: onKey,
        onPointerDown: (e) => { capture(e); dragging.current = true; lookAt(e); },
        onPointerMove: (e) => { if (dragging.current || e.pointerType === 'mouse') lookAt(e); },
        onPointerUp: () => { dragging.current = false; },
      }}>
      {STARS.map((s) => (
        <span key={s.id} className="mg-star" data-found={found.includes(s.id) || undefined} style={{ left: `${s.x}%`, top: `${s.y}%` }} aria-hidden="true">
          {s.emoji}
        </span>
      ))}
      <span className="mg-lens" style={{ left: `${lens.x}%`, top: `${lens.y}%` }} aria-hidden="true" />
    </GameShell>
  );
}
