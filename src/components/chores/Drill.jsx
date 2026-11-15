// 🔬 Дослід надворі: тримай кнопку бура, щоб дістати 3 зразки. Щоразу інше: камінці, лід, кристали, пил, метеорит.
import { useEffect, useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { capture, useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const SAMPLES = 3;
const VARIANTS = [
  { key: 'rocks', sample: '🪨', hold: 2400 },
  { key: 'ice', sample: '🧊', hold: 2800 },
  { key: 'crystals', sample: '💎', hold: 2600 },
  { key: 'dust', sample: '🧪', hold: 2200 },
  { key: 'meteor', sample: '☄️', hold: 3000 },
];
const TICK_MS = 50;

export default function Drill({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const HOLD_MS = v.hold;
  const [depth, setDepth] = useState(0); // 0…1
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const last = useRef(0);
  const depthRef = useRef(0);
  const [done, finish] = useFinish(onDone);

  // Поки кнопку тримають — бур іде глибше (простий таймер: працює рівно на будь-якому пристрої)
  useEffect(() => {
    if (!holding || done) return undefined;
    last.current = performance.now();
    timer.current = setInterval(() => {
      const now = performance.now();
      const d = Math.min(1, depthRef.current + (now - last.current) / HOLD_MS);
      const before = Math.floor(depthRef.current * SAMPLES);
      last.current = now;
      depthRef.current = d;
      setDepth(d);
      if (Math.floor(d * SAMPLES) > before) play('click');
      if (d >= 1) {
        clearInterval(timer.current);
        finish();
      }
    }, TICK_MS);
    return () => clearInterval(timer.current);
  }, [holding, done, finish, HOLD_MS]);

  const step = () => {
    // клавіатура: кожне натискання — трохи глибше
    const d = Math.min(1, depthRef.current + 0.1);
    depthRef.current = d;
    setDepth(d);
    play('tick');
    if (d >= 1) finish();
  };

  const samples = Math.floor(depth * SAMPLES);
  return (
    <GameShell icon="🔬" title={t(`levels.chore.experiment.v.${v.key}`)} t={t} done={done}
      progress={depth} label={t('decision.task_progress', { n: samples, total: SAMPLES })}
      fieldProps={{ className: 'mg__field--ground' }}>
      <div className="mg-drill" aria-hidden="true">
        <span className="mg-drill__rig" style={{ '--d': depth }} data-on={holding || undefined}>⛏️</span>
        <span className="mg-drill__shaft" style={{ '--d': depth }} />
        <span className="mg-drill__samples">{v.sample.repeat(samples)}</span>
      </div>
      <button
        type="button"
        className="mg-hold"
        data-sfx="none"
        data-on={holding || undefined}
        onPointerDown={(e) => { capture(e); setHolding(true); }}
        onPointerUp={() => setHolding(false)}
        onPointerCancel={() => setHolding(false)}
        onPointerLeave={() => setHolding(false)}
        onClick={(e) => { if (e.detail === 0) step(); }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {t('decision.mg.drill')}
      </button>
    </GameShell>
  );
}
