// 🔋 Увімкнути генератор: крути ручку по колу — 3 оберти, і батарея заряджена.
// Торкання або Enter на ручці — чверть оберту.
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { capture, useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const FULL = Math.PI * 2;
const VARIANTS = [
  { key: 'three', turns: 3, cell: '⚡' },
  { key: 'four', turns: 4, cell: '🔋' },
  { key: 'storm', turns: 3, cell: '💡' },
];

export default function Crank({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const TURNS = v.turns;
  const [angle, setAngle] = useState(0);   // сумарний кут (радіани)
  const wheel = useRef(null);
  const last = useRef(null);
  const total = useRef(0);
  const [done, finish] = useFinish(onDone);

  const addAngle = (delta) => {
    const before = Math.floor(total.current / FULL);
    total.current = Math.max(0, total.current + delta);
    setAngle(total.current);
    if (Math.floor(total.current / FULL) > before) play('select');
    if (total.current >= TURNS * FULL) finish();
  };

  const angleAt = (e) => {
    const r = wheel.current.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };

  const down = (e) => {
    capture(e);
    last.current = angleAt(e);
  };
  const move = (e) => {
    if (last.current === null || done) return;
    const a = angleAt(e);
    let d = a - last.current;
    if (d > Math.PI) d -= FULL;
    if (d < -Math.PI) d += FULL;
    last.current = a;
    addAngle(Math.abs(d)); // будь-який напрям рахується — головне крутити
  };

  const turns = Math.min(TURNS, angle / FULL);
  return (
    <GameShell icon="🔋" title={t(`levels.chore.generator.v.${v.key}`, { n: TURNS })} t={t} done={done}
      progress={turns / TURNS} label={t('decision.mg.turns', { n: Math.floor(turns), total: TURNS })}
      fieldProps={{ className: 'mg__field--crank' }}>
      <div
        ref={wheel}
        className="mg-crank"
        role="button"
        tabIndex={0}
        aria-label={t('decision.mg.crank')}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={() => { last.current = null; }}
        onPointerCancel={() => { last.current = null; }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addAngle(FULL / 4); } }}
      >
        <span className="mg-crank__arm" style={{ transform: `rotate(${angle}rad)` }}>
          <span className="mg-crank__handle" />
        </span>
        <span className="mg-crank__hint" aria-hidden="true">↻</span>
      </div>
      <div className="mg-battery" aria-hidden="true">
        {[...Array(TURNS).keys()].map((i) => <span key={i} data-on={turns >= i + 1 || undefined}>{v.cell}</span>)}
      </div>
    </GameShell>
  );
}
