// «Будівник захисту» (з MoonShift): 3D-принтер друкує цеглини, вони падають — закрий сяйну зону над модулем.
// ← → рух, ↑ поворот, ↓ швидше, Пробіл — скинути (або кнопки на екрані, або торкнись стовпчика).
// Щоразу інший матеріал: цеглини з реголіту, баки з водою, блоки льоду, камені.
import { useMemo, useRef, useState } from 'react';
import BigGame from './BigGame.jsx';
import SpaceBg from './SpaceBg.jsx';
import { C, W, clamp, mulberry32, toSvg, useTicker } from './kit.js';
import { pickVariant } from '../variant.js';
import { play } from '../../sfx.js';
import { CONFIG } from '../../../game/config.js';

const S = 36;
const COLS = 16;
const ROWS = 11;
const GX = 192;
const GY = 132;
const WIN = 0.85;

const VARIANTS = [
  { key: 'regolith', d: 0.3, tones: ['#8d8a99', '#b9b5c6', '#a3a0b0'], icon: '🧱' },
  { key: 'water', d: 0.45, tones: ['#2f7fd8', '#5aa0ff', '#3d8bff'], icon: '🛢️' },
  { key: 'ice', d: 0.6, tones: ['#bfe8ff', '#9fd4ff', '#d9f3ff'], icon: '🧊' },
  { key: 'rock', d: 0.75, tones: ['#7a6a5a', '#8f7f6a', '#6a5a4a'], icon: '🪨' },
];

const PIECES = [
  { cells: [[0, 0]], w: () => 3 },
  { cells: [[0, 0], [1, 0]], w: () => 3 },
  { cells: [[0, 0], [1, 0], [2, 0]], w: () => 2 },
  { cells: [[0, 0], [1, 0], [0, 1]], w: (d) => 2 + d },
  { cells: [[0, 0], [1, 0], [0, 1], [1, 1]], w: (d) => 1 + d },
];

// Модуль бази (стан 1) і зона захисту навколо нього (≤ 2,3 клітинки)
const HAB = [];
for (let c = 5; c <= 10; c++) { HAB.push([c, 9]); HAB.push([c, 10]); }
for (let c = 6; c <= 9; c++) HAB.push([c, 8]);
const isHab = (c, r) => HAB.some(([x, y]) => x === c && y === r);
const ZONE = [];
for (let r = 0; r < ROWS; r++) {
  for (let c = 0; c < COLS; c++) {
    if (!isHab(c, r) && HAB.some(([x, y]) => Math.hypot(x - c, y - r) <= 2.3)) ZONE.push(`${c},${r}`);
  }
}
const ZONE_SET = new Set(ZONE);

const width = (cells) => Math.max(...cells.map(([x]) => x)) + 1;
const rotate = (cells) => {
  const r = cells.map(([x, y]) => [-y, x]);
  const mx = Math.min(...r.map(([x]) => x));
  const my = Math.min(...r.map(([, y]) => y));
  return r.map(([x, y]) => [x - mx, y - my]);
};

function Game({ t, v, seed, limit, onDone }) {
  const rnd = useMemo(() => mulberry32(seed), [seed]);
  const pick = () => {
    const ws = PIECES.map((p) => p.w(v.d));
    let roll = rnd() * ws.reduce((a, b) => a + b, 0);
    const i = ws.findIndex((w) => (roll -= w) < 0);
    return { cells: PIECES[Math.max(0, i)].cells, tone: v.tones[Math.floor(rnd() * v.tones.length)] };
  };
  // сітка: ключ "c,r" → колір цеглини
  const [grid, setGrid] = useState({});
  const gridRef = useRef({});
  const [piece, setPiece] = useState(() => {
    const p = pick();
    return { ...p, x: Math.floor((COLS - width(p.cells)) / 2), y: 0 };
  });
  const pieceRef = useRef(piece);
  const [next, setNext] = useState(() => pick());
  const nextRef = useRef(next);
  const [stats, setStats] = useState({ filled: 0, wasted: 0 });
  const statsRef = useRef(stats);
  const [flash, setFlash] = useState([]);
  const [hint, setHint] = useState(t('games.bricks.start'));
  const [time, setTime] = useState(0);
  const [end, setEnd] = useState(null);
  const ended = useRef(false);
  const svg = useRef(null);
  const loop = useRef({ fall: 0, print: 0.35, aim: null, aimT: 0, soft: false, repeat: null });

  const fallEvery = 0.36 - 0.16 * v.d;
  const free = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !isHab(c, r) && !gridRef.current[`${c},${r}`];
  const fits = (p, x = p.x, y = p.y, cells = p.cells) => cells.every(([dx, dy]) => free(x + dx, y + dy));

  const setP = (p) => {
    pieceRef.current = p;
    setPiece(p);
  };

  const finish = (win, why) => {
    if (ended.current) return;
    ended.current = true;
    const cov = statsRef.current.filled / ZONE.length;
    const success = win || cov >= 0.7;
    const score = clamp(cov - Math.min(0.1, 0.01 * statsRef.current.wasted), 0, 1);
    setEnd({ win, success });
    setHint(win ? t('games.bricks.win') : why);
    play(win ? 'good' : success ? 'chime' : 'bad');
    setTimeout(() => onDone({ success, score: Math.round(score * 100) / 100 }), win ? 900 : 500);
  };

  const lock = () => {
    const p = pieceRef.current;
    const g = { ...gridRef.current };
    let { filled, wasted } = statsRef.current;
    const newFlash = [];
    for (const [dx, dy] of p.cells) {
      const k = `${p.x + dx},${p.y + dy}`;
      g[k] = p.tone;
      if (ZONE_SET.has(k)) { filled += 1; newFlash.push(k); } else wasted += 1;
    }
    gridRef.current = g;
    setGrid(g);
    const before = Math.floor((statsRef.current.filled / ZONE.length) * 4);
    statsRef.current = { filled, wasted };
    setStats(statsRef.current);
    setFlash(newFlash);
    play('pop');
    const cov = filled / ZONE.length;
    const m = Math.floor(cov * 4);
    if (m > before && m < 4) {
      play('coin');
      setHint(t(`games.bricks.m${m}`));
    }
    if (cov >= WIN) { finish(true); return; }
    // наступна цеглина
    const n = nextRef.current;
    const spawn = { ...n, x: Math.floor((COLS - width(n.cells)) / 2), y: 0 };
    const nn = pick();
    nextRef.current = nn;
    setNext(nn);
    if (!fits(spawn)) { finish(false, t('games.bricks.noRoom')); return; }
    setP(spawn);
    loop.current.print = 0.35;
    loop.current.aim = null;
  };

  const move = (dx) => {
    const p = pieceRef.current;
    if (!ended.current && fits(p, p.x + dx)) setP({ ...p, x: p.x + dx });
  };
  const turn = () => {
    const p = pieceRef.current;
    if (ended.current) return;
    const cells = rotate(p.cells);
    const shift = Math.floor((width(p.cells) - width(cells)) / 2);
    for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [0, 1], [-2, 0], [2, 0]]) {
      if (fits(p, p.x + shift + kx, p.y + ky, cells)) {
        setP({ ...p, cells, x: p.x + shift + kx, y: p.y + ky });
        play('click');
        return;
      }
    }
  };
  const drop = () => {
    let p = pieceRef.current;
    if (ended.current) return;
    while (fits(p, p.x, p.y + 1)) p = { ...p, y: p.y + 1 };
    setP(p);
    lock();
  };

  useTicker((dt, elapsed) => {
    if (ended.current) return;
    setTime(elapsed);
    if (elapsed >= limit) { finish(false, t('games.time_up')); return; }
    const L = loop.current;
    if (L.repeat) {
      L.repeat.t -= dt;
      if (L.repeat.t <= 0) { move(L.repeat.dx); L.repeat.t = 0.1; }
    }
    if (L.aim !== null) {
      L.aimT -= dt;
      if (L.aimT <= 0) {
        const p = pieceRef.current;
        const centre = p.x + Math.floor(width(p.cells) / 2);
        if (centre === L.aim || !fits(p, p.x + Math.sign(L.aim - centre))) L.aim = null;
        else move(Math.sign(L.aim - centre));
        L.aimT = 0.1;
      }
    }
    if (L.print > 0) { L.print -= dt; return; }
    L.fall += dt;
    const every = L.soft ? 0.05 : fallEvery;
    if (L.fall >= every) {
      L.fall = 0;
      const p = pieceRef.current;
      if (fits(p, p.x, p.y + 1)) setP({ ...p, y: p.y + 1 });
      else lock();
    }
  }, !end);

  const onKey = (e) => {
    if (ended.current) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); turn(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); loop.current.soft = true; }
    else if (e.key === ' ') { e.preventDefault(); drop(); }
  };
  const onKeyUp = (e) => { if (e.key === 'ArrowDown') loop.current.soft = false; };

  const fieldDown = (e) => {
    const pt = toSvg(svg.current, e);
    if (pt.y < GY - 40 || pt.y > GY + ROWS * S || pt.x < GX || pt.x > GX + COLS * S) return;
    loop.current.aim = clamp(Math.floor((pt.x - GX) / S), 0, COLS - 1);
    loop.current.aimT = 0;
  };

  // кнопки на екрані: ◀ ▶ тримаються (повтор), ⟳ і ⤓ — по одному натиску
  const padDown = (e, pad) => {
    e.stopPropagation();
    if (pad === 'rotate') { turn(); return; }
    if (pad === 'drop') { drop(); return; }
    move(pad);
    loop.current.repeat = { dx: pad, t: 0.3 };
    loop.current.aim = null;
  };
  const padUp = () => { loop.current.repeat = null; };

  // тінь цеглини рахуємо зі стану сітки (не з ref) — так рендер завжди свіжий
  const p = piece;
  const freeNow = (c, r) => c >= 0 && c < COLS && r >= 0 && r < ROWS && !isHab(c, r) && !grid[`${c},${r}`];
  let ghostY = p.y;
  while (p.cells.every(([dx, dy]) => freeNow(p.x + dx, ghostY + 1 + dy))) ghostY += 1;
  const cov = stats.filled / ZONE.length;
  const left = Math.max(0, limit - time);
  const timeFrac = left / limit;
  const doseInside = cov === 0 ? '100%' : `100% → ${Math.round(100 - 75 * cov)}%`;
  const cellXY = (c, r) => [GX + c * S, GY + r * S];

  const brick = (c, r, tone, key) => {
    const [x, y] = cellXY(c, r);
    return (
      <g key={key}>
        <rect x={x} y={y} width={S} height={S} fill={tone} stroke="#23212f" strokeWidth="2" />
        {[4, 10, 16, 22, 28].map((o) => <rect key={o} x={x + 2} y={y + o} width={S - 4} height="2" fill="#000" opacity="0.13" />)}
        <rect x={x + 2} y={y + 2} width={S - 4} height="3" fill="#fff" opacity="0.22" />
      </g>
    );
  };

  return (
    <svg ref={svg} className="bg-svg" viewBox={`0 0 ${W} 600`} tabIndex={0} role="application" aria-label={t('games.bricks.title')}
      onKeyDown={onKey} onKeyUp={onKeyUp} onPointerDown={fieldDown}>
      <SpaceBg seed={seed} horizonY={528} id="bb" />
      <circle cx="884" cy="70" r="30" fill={C.sun} opacity="0.18" />
      <circle cx="884" cy="70" r="16" fill={C.sun} />
      {/* портал принтера */}
      <rect x="168" y="97" width="624" height="10" fill={C.line} />
      {[170, 778].map((x) => <g key={x}><rect x={x} y="107" width="3" height="421" fill={C.line} /><rect x={x + 9} y="107" width="3" height="421" fill={C.line} /></g>)}
      {/* зона захисту */}
      <g className={end ? '' : 'bg-pulse'}>
        {ZONE.map((k) => {
          const [c, r] = k.split(',').map(Number);
          const [x, y] = cellXY(c, r);
          return <rect key={k} x={x + 2} y={y + 2} width={S - 4} height={S - 4} fill={C.cyan} fillOpacity="0.08" stroke={C.cyan} strokeWidth="2" strokeDasharray="6 6" />;
        })}
      </g>
      {/* модуль бази */}
      <path d="M372 528 V486 Q372 456 402 456 H558 Q588 456 588 486 V528 Z" fill="#cdc9da" stroke="#23212f" strokeWidth="6" />
      <path d="M408 456 V438 Q408 420 426 420 H534 Q552 420 552 438 V456 Z" fill="#cdc9da" stroke="#23212f" strokeWidth="6" />
      {[440, 480, 520].map((x) => <g key={x}><circle cx={x} cy="438" r="14" fill={C.cyan} opacity="0.2" /><circle cx={x} cy="438" r="8" fill="#9fe8ff" stroke="#23212f" strokeWidth="2" /></g>)}
      <rect x="392" y="462" width="176" height="56" rx="8" fill={C.space1} opacity="0.95" stroke={C.cyan} strokeOpacity="0.6" strokeWidth="2" />
      <text x="480" y="482" textAnchor="middle" fill={C.muted} fontSize="18">{t('games.bricks.dose')}</text>
      <text x="480" y="506" textAnchor="middle" className="bg-num" fontSize="22" fill={100 - 75 * cov > 70 ? C.red : 100 - 75 * cov > 45 ? C.amber : C.green}>{doseInside}</text>
      <ellipse cx="480" cy="528" rx="145" ry="10" fill={C.regolith} />
      {/* цеглини */}
      {Object.entries(grid).map(([k, tone]) => { const [c, r] = k.split(',').map(Number); return brick(c, r, tone, k); })}
      {flash.map((k) => { const [c, r] = k.split(',').map(Number); const [x, y] = cellXY(c, r); return <rect key={`f${k}`} x={x} y={y} width={S} height={S} fill={C.green} className="bg-flash" />; })}
      {!end && ghostY > p.y && p.cells.map(([dx, dy]) => { const [x, y] = cellXY(p.x + dx, ghostY + dy); return <rect key={`g${dx}${dy}`} x={x} y={y} width={S} height={S} fill="#fff" fillOpacity="0.12" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />; })}
      {!end && p.cells.map(([dx, dy]) => brick(p.x + dx, p.y + dy, p.tone, `p${dx}${dy}`))}
      {/* каретка принтера */}
      {!end && (
        <g transform={`translate(${GX + (p.x + width(p.cells) / 2) * S} 102)`}>
          <rect x="-32" y="-15" width="64" height="24" rx="6" fill={C.panel} stroke={C.cyan} strokeWidth="2" />
          <circle cx="-21" cy="-3" r="3" fill={C.green} />
          <polygon points="-9,8 9,8 0,21" fill={C.regolithLight} />
        </g>
      )}
      {/* HUD */}
      <rect x="192" y="14" width="506" height="14" rx="7" fill={C.panel} />
      <rect x="192" y="14" width={506 * timeFrac} height="14" rx="7" fill={timeFrac > 0.25 ? C.cyan : timeFrac > 0.1 ? C.amber : C.red} />
      <text x="740" y="28" textAnchor="middle" className="bg-num" fill={C.text} fontSize="22">{Math.ceil(left)}{t('games.sec')}</text>
      <text x="480" y="64" textAnchor="middle" fill={end ? (end.win ? C.green : C.amber) : C.text} fontSize="20" stroke={C.space0} strokeWidth="4" paintOrder="stroke">{hint}</text>
      <text x="92" y="156" textAnchor="middle" fill={C.muted} fontSize="20">{t('games.bricks.shield')}</text>
      <text x="92" y="206" textAnchor="middle" className="bg-num" fill={cov >= WIN ? C.green : C.cyan} fontSize="56">{Math.round(cov * 100)}%</text>
      <rect x="20" y="236" width="144" height="14" rx="7" fill={C.panel} />
      <rect x="20" y="236" width={144 * Math.min(1, cov)} height="14" rx="7" fill={cov >= WIN ? C.green : C.cyan} />
      <rect x="141" y="230" width="3" height="26" fill="#fff" />
      <text x="92" y="278" textAnchor="middle" fill={C.text} fontSize="16">{t('games.bricks.goal')} 85%</text>
      <text x="866" y="156" textAnchor="middle" fill={C.muted} fontSize="20">{t('games.bricks.next')}</text>
      <rect x="792" y="172" width="148" height="104" rx="10" fill={C.panel} opacity="0.9" stroke={C.line} strokeWidth="2" />
      {next.cells.map(([dx, dy]) => {
        const ox = 866 - (width(next.cells) * 26) / 2;
        const oh = (Math.max(...next.cells.map(([, y]) => y)) + 1) * 26;
        return <rect key={`n${dx}${dy}`} x={ox + dx * 26} y={224 - oh / 2 + dy * 26} width="26" height="26" fill={next.tone} stroke="#23212f" strokeWidth="2" />;
      })}
      <text x="866" y="306" textAnchor="middle" fill={C.muted} fontSize="16">{t('games.bricks.wasted')} {stats.wasted}</text>
      {/* кнопки на екрані */}
      {[
        { x: 54, label: '◀', pad: -1, aria: t('games.bricks.left') },
        { x: 144, label: '▶', pad: 1, aria: t('games.bricks.right') },
        { x: 816, label: '⟳', pad: 'rotate', aria: t('games.bricks.rotate') },
        { x: 906, label: '⤓', pad: 'drop', aria: t('games.bricks.drop') },
      ].map((b) => (
        <g key={b.x} className="bg-pad" role="button" aria-label={b.aria} onPointerDown={(e) => padDown(e, b.pad)} onPointerUp={padUp} onPointerLeave={padUp}>
          <rect x={b.x - 40} y="506" width="80" height="80" rx="16" fill={C.panel} stroke={C.line} strokeWidth="3" />
          {b.pad === 'rotate' ? (
            <g fill="none" stroke={C.text} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d={`M${b.x + 17} 546 A17 17 0 1 1 ${b.x + 8} 531`} />
              <path d={`M${b.x + 4} 522 L${b.x + 10} 531 L${b.x - 1} 535`} />
            </g>
          ) : (
            <text x={b.x} y="560" textAnchor="middle" fill={C.text} fontSize="40">{b.label}</text>
          )}
        </g>
      ))}
    </svg>
  );
}

export default function BrickBuilder({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const limit = CONFIG.games.seconds.bricks;
  return (
    <BigGame id="bricks" t={t} seconds={limit} title={`${v.icon} ${t(`games.bricks.v.${v.key}`)}`}>
      <Game t={t} v={v} seed={777 + variant * 131} limit={limit} onDone={onDone} />
    </BigGame>
  );
}
