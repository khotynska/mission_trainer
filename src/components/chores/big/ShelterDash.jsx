// «Ривок до укриття» (з MoonShift): радіаційна тривога — добіжи до штормового укриття!
// Торкнись місця на карті або рухайся стрілками / WASD. Дорогою зачини відчинені люки й візьми аптечку.
// Щоразу інше: звідки біжиш (з кімнати чи ззовні), де аптечка й які люки відчинені.
import { useMemo, useRef, useState } from 'react';
import BigGame from './BigGame.jsx';
import SpaceBg from './SpaceBg.jsx';
import { C, W, mulberry32, toSvg, useTicker } from './kit.js';
import { pickVariant } from '../variant.js';
import { play } from '../../sfx.js';
import { CONFIG } from '../../../game/config.js';

const T = 56;
const OX = 60;
const OY = 56;
const MAP = [
  'rrr############',
  'rrr#hhh#ggg#ww#',
  'rrr#hhh#ggg#ss#',
  'rr#a#d###d##ss#',
  'rroa,,,,,,,Dss#',
  'rr#a#d###d##ss#',
  'rrr#lll#kkk#ss#',
  'rrr#lll#kkk#ww#',
  'rrr############',
];
const FLOOR = { ',': '#34427f', d: '#34427f', o: '#34427f', D: '#34427f', a: '#3d4166', h: '#3f3a78', g: '#285a48', l: '#23506a', k: '#5a4430', s: '#1d5a3e' };
const DOORS = { h: { x: 5, y: 3, dir: -1 }, g: { x: 9, y: 3, dir: -1 }, l: { x: 5, y: 5, dir: 1 }, k: { x: 9, y: 5, dir: 1 } };
const SHELTER_SPOTS = [[13, 2], [13, 4], [13, 6]];
const CREW = [{ id: 'ada', color: C.violet }, { id: 'kofi', color: C.amber }, { id: 'lin', color: C.green }];
const STEP = 0.17;
const NPC_STEP = 0.42;

const VARIANTS = [
  { d: 0.3, outside: false },
  { d: 0.45, outside: true },
  { d: 0.6, outside: false },
  { d: 0.75, outside: true },
];

const tile = (x, y) => MAP[y]?.[x];
const walkable = (x, y) => { const c = tile(x, y); return c !== undefined && c !== '#' && c !== 'w'; };

function bfs(from, to) {
  const key = (p) => `${p[0]},${p[1]}`;
  const prev = new Map([[key(from), null]]);
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur[0] === to[0] && cur[1] === to[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = [cur[0] + dx, cur[1] + dy];
      if (walkable(...n) && !prev.has(key(n))) { prev.set(key(n), cur); q.push(n); }
    }
  }
  if (!prev.has(key(to))) return [];
  const path = [];
  for (let p = to; p && key(p) !== key(from); p = prev.get(key(p))) path.unshift(p);
  return path;
}

function setup(v, seed) {
  const rnd = mulberry32(seed);
  const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const tilesOf = (ch) => MAP.flatMap((row, y) => [...row].map((c, x) => (c === ch ? [x, y] : null)).filter(Boolean));
  const roomKeys = ['h', 'g', 'l', 'k'];
  let start;
  let startRoom = null;
  if (v.outside) start = rnd() < 0.5 ? [0, 1] : [0, 7];
  else {
    startRoom = roomKeys[Math.floor(rnd() * 4)];
    const ts = tilesOf(startRoom);
    start = ts[Math.floor(rnd() * ts.length)];
  }
  const medRoom = shuffle(roomKeys.filter((k) => k !== startRoom))[0];
  const door = DOORS[medRoom];
  const medkit = [door.x, door.y + door.dir * (v.d < 0.5 ? 1 : 2)];
  const nHatch = v.d < 0.5 ? 2 : 3;
  const candidates = shuffle([...roomKeys.map((k) => [DOORS[k].x, DOORS[k].y]), [7, 4]]);
  const hatches = v.outside ? [[2, 4], ...candidates.slice(0, nHatch - 1)] : candidates.slice(0, nHatch);
  const spots = shuffle(roomKeys.flatMap(tilesOf).concat(tilesOf('a'))).filter((p) => !(p[0] === start[0] && p[1] === start[1]) && !(p[0] === medkit[0] && p[1] === medkit[1]));
  const crew = CREW.map((c, i) => ({ ...c, pos: spots[i], path: bfs(spots[i], SHELTER_SPOTS[i]), wait: 0.5 + i * 0.4, t: 0 }));
  return { start, medkit, hatches, crew };
}

const center = ([x, y]) => [OX + x * T + T / 2, OY + y * T + T / 2];

function Astro({ x, y, color, label, you }) {
  return (
    <g transform={`translate(${x - 18} ${y - 26})`} aria-hidden="true">
      {you && <ellipse cx="18" cy="40" rx="18" ry="6" fill={C.cyan} opacity="0.45" />}
      <rect x="3" y="14" width="12" height="18" rx="4" fill="#5b6488" />
      <rect x="8" y="16" width="22" height="20" rx="7" fill={color} />
      <rect x="10" y="33" width="7" height="7" fill={color} />
      <rect x="21" y="33" width="7" height="7" fill={color} />
      <circle cx="19" cy="12" r="11" fill="#eef2ff" />
      <rect x="13" y="6" width="15" height="11" rx="5" fill="#1b2a5c" />
      <rect x="16" y="8" width="5" height="2" fill={C.cyan} opacity="0.8" />
      <text x="18" y="56" textAnchor="middle" fontSize="16" fill={you ? C.cyan : C.text} stroke={C.space0} strokeWidth="4" paintOrder="stroke">{label}</text>
    </g>
  );
}

function Game({ t, v, seed, limit, onDone }) {
  const init = useMemo(() => setup(v, seed), [v, seed]);
  const [pos, setPos] = useState(init.start);   // поточна клітинка
  const [anim, setAnim] = useState(null);       // { from, to, p }
  const [route, setRoute] = useState([]);
  const [closed, setClosed] = useState([]);
  const [medkit, setMedkit] = useState(false);
  const [crew, setCrew] = useState(init.crew);
  const [time, setTime] = useState(0);
  const [dose, setDose] = useState(0);
  const [marker, setMarker] = useState(null);
  const [end, setEnd] = useState(null);
  const ended = useRef(false);
  const st = useRef({ pos: init.start, anim: null, route: [], keys: new Set(), queued: null, closed: [], medkit: false, siren: 0, time: 0 });
  const svg = useRef(null);

  const finish = (success) => {
    if (ended.current) return;
    ended.current = true;
    const parts = 0.25 * (st.current.closed.length / init.hatches.length) + 0.25 * (st.current.medkit ? 1 : 0);
    const used = Math.min(st.current.time, limit);
    const score = success ? (0.5 + parts) * (1 - (0.15 * used) / limit) : parts;
    setEnd({ success });
    play(success ? 'good' : 'bad');
    setTimeout(() => onDone({ success, score: Math.round(score * 100) / 100 }), 1100);
  };

  const arrive = (p) => {
    const s = st.current;
    if (init.hatches.some((h) => h[0] === p[0] && h[1] === p[1]) && !s.closed.some((h) => h[0] === p[0] && h[1] === p[1])) {
      s.closed = [...s.closed, p];
      setClosed(s.closed);
      play('pop');
    }
    if (!s.medkit && p[0] === init.medkit[0] && p[1] === init.medkit[1]) {
      s.medkit = true;
      setMedkit(true);
      play('coin');
    }
    if (tile(...p) === 's') finish(true);
  };

  const tryStep = (dx, dy) => {
    const s = st.current;
    const to = [s.pos[0] + dx, s.pos[1] + dy];
    if (!walkable(...to)) return false;
    s.anim = { from: s.pos, to, p: 0 };
    return true;
  };

  useTicker((dt, elapsed) => {
    if (ended.current) return;
    const s = st.current;
    s.time = elapsed;
    setTime(elapsed);
    if (elapsed >= limit) { finish(false); return; }
    // сирена: на старті, на 1, 2, 3 с і далі кожні 3 с
    const sirenAt = [0, 1, 2, 3];
    const nextSiren = s.siren < sirenAt.length ? sirenAt[s.siren] : 3 + (s.siren - 3) * 3;
    if (elapsed >= nextSiren) { play('alarm'); s.siren += 1; }
    // рух гравця
    if (s.anim) {
      s.anim.p += dt / STEP;
      if (s.anim.p >= 1) {
        s.pos = s.anim.to;
        s.anim = null;
        setPos(s.pos);
        arrive(s.pos);
      }
    }
    if (!s.anim && !ended.current) {
      const order = [['ArrowLeft', 'a', -1, 0], ['ArrowRight', 'd', 1, 0], ['ArrowUp', 'w', 0, -1], ['ArrowDown', 's', 0, 1]];
      const held = order.find(([k1, k2]) => s.keys.has(k1) || s.keys.has(k2));
      const q = s.queued;
      if (held || q) {
        s.route = [];
        setRoute([]);
        const [, , dx, dy] = held ?? q;
        s.queued = null;
        tryStep(dx, dy);
      } else if (s.route.length) {
        const [nx, ny] = s.route[0];
        s.route = s.route.slice(1);
        setRoute(s.route);
        tryStep(nx - s.pos[0], ny - s.pos[1]);
      }
    }
    setAnim(s.anim ? { ...s.anim } : null);
    // доза (лише для показу)
    const zone = tile(...(s.anim && s.anim.p > 0.5 ? s.anim.to : s.pos));
    const rate = zone === 'r' ? 0.9 : zone === 's' ? 0.02 : 0.25;
    setDose((d) => d + rate * (0.6 + 0.2 * 3) * dt);
    // екіпаж іде до укриття
    setCrew((cs) => cs.map((c) => {
      if (c.wait > 0) return { ...c, wait: c.wait - dt };
      if (!c.path.length) return c;
      const t2 = c.t + dt;
      if (t2 < NPC_STEP) return { ...c, t: t2 };
      return { ...c, pos: c.path[0], path: c.path.slice(1), t: 0 };
    }));
  }, !end);

  const keyDown = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const map = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowRight: [1, 0], d: [1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowDown: [0, 1], s: [0, 1], ф: [-1, 0], в: [1, 0], ц: [0, -1], і: [0, 1] };
    if (!map[k]) return;
    e.preventDefault();
    const norm = { ф: 'a', в: 'd', ц: 'w', і: 's' }[k] ?? k;
    if (!e.repeat) st.current.queued = [norm, norm, ...map[k]];
    st.current.keys.add(norm);
  };
  const keyUp = (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const norm = { ф: 'a', в: 'd', ц: 'w', і: 's' }[k] ?? k;
    st.current.keys.delete(norm);
  };

  const tap = (e) => {
    if (ended.current) return;
    const pt = toSvg(svg.current, e);
    if (pt.y < OY || pt.y > OY + 9 * T) return;
    let best = null;
    MAP.forEach((row, y) => [...row].forEach((c, x) => {
      if (!walkable(x, y)) return;
      const [cx, cy] = center([x, y]);
      const d = Math.hypot(cx - pt.x, cy - pt.y);
      if (!best || d < best.d) best = { d, p: [x, y] };
    }));
    if (!best) return;
    const from = st.current.anim ? st.current.anim.to : st.current.pos;
    const path = bfs(from, best.p);
    st.current.route = path;
    st.current.queued = null;
    setRoute(path);
    setMarker({ p: best.p, k: Date.now() });
  };

  // позиція гравця з інтерполяцією
  const [px, py] = anim ? (() => {
    const [ax, ay] = center(anim.from);
    const [bx, by] = center(anim.to);
    return [ax + (bx - ax) * anim.p, ay + (by - ay) * anim.p];
  })() : center(pos);
  const left = Math.max(0, limit - time);
  const outside = tile(...pos) === 'r';
  const hint = time < 3 ? 'move' : outside ? 'outside' : closed.length < init.hatches.length ? 'hatches' : !medkit ? 'medkit' : 'shelter';

  return (
    <svg ref={svg} className="bg-svg" viewBox={`0 0 ${W} 600`} tabIndex={0} role="application" aria-label={t('games.dash.title')}
      onKeyDown={keyDown} onKeyUp={keyUp} onPointerDown={tap}>
      <SpaceBg seed={seed} id="sd" />
      {/* карта */}
      {MAP.map((row, y) => [...row].map((c, x) => {
        const X = OX + x * T;
        const Y = OY + y * T;
        if (c === '#') {
          return x >= 11
            ? <g key={`${x},${y}`}><rect x={X} y={Y} width={T} height={T} fill="#34323f" /><rect x={X + 6} y={Y + 8} width={T - 12} height="16" rx="6" fill={C.regolithDark} /><rect x={X + 6} y={Y + 30} width={T - 12} height="16" rx="6" fill={C.regolithDark} /></g>
            : <rect key={`${x},${y}`} x={X + 3} y={Y + 3} width={T - 6} height={T - 6} fill="#0a0e24" stroke={C.line} strokeOpacity="0.7" strokeWidth="2" />;
        }
        if (c === 'r') return <rect key={`${x},${y}`} x={X} y={Y} width={T} height={T} fill={C.regolith} />;
        if (c === 'w') return <g key={`${x},${y}`}><rect x={X} y={Y} width={T} height={T} fill="#1d5a3e" /><rect x={X + 5} y={Y + 7} width={T - 10} height={T - 14} rx="10" fill="#2f7fd8" /><rect x={X + 12} y={Y + 12} width="8" height={T - 24} fill="#9fd4ff" opacity="0.6" /></g>;
        return <rect key={`${x},${y}`} x={X} y={Y} width={T} height={T} fill={FLOOR[c] ?? '#34427f'} stroke="#fff" strokeOpacity="0.07" />;
      }))}
      {/* стіни укриття */}
      {[5, 15, 25].map((o, i) => <rect key={o} x={732 - o} y={112 - o} width={2 * T + 2 * o} height={7 * T + 2 * o} fill="none" stroke={[C.green, '#2fa874', '#1d6b4c'][i]} strokeWidth="5" opacity="0.95" />)}
      <rect x={OX + 11 * T + 6} y={OY + 4 * T} width={T - 12} height={T} fill="#56649a" stroke={C.green} strokeWidth="3" style={{ transformOrigin: `${OX + 11 * T + T / 2}px ${OY + 4 * T + T / 2}px`, transform: `scaleY(${end?.success ? 1 : 0.08})`, transition: 'transform 450ms ease-out' }} />
      {/* підписи */}
      <g fontSize="16" fontWeight="700" fill={C.muted} stroke={C.space0} strokeWidth="4" paintOrder="stroke" textAnchor="middle">
        <text x={OX + 5 * T + T / 2} y={OY + 0.6 * T}>{t('games.dash.rooms.h')}</text>
        <text x={OX + 9 * T + T / 2} y={OY + 0.6 * T}>{t('games.dash.rooms.g')}</text>
        <text x={OX + 5 * T + T / 2} y={OY + 8.6 * T}>{t('games.dash.rooms.l')}</text>
        <text x={OX + 9 * T + T / 2} y={OY + 8.6 * T}>{t('games.dash.rooms.k')}</text>
        <text x="228" y="202">{t('games.dash.airlock')}</text>
        <text x="788" y="84" fill={C.green}>{t('games.dash.shelter')}</text>
        <text x="788" y="510" fill={C.green}>{t('games.dash.thickWalls')}</text>
      </g>
      {/* люки */}
      {init.hatches.map((h) => {
        const [cx, cy] = center(h);
        const isClosed = closed.some((c) => c[0] === h[0] && c[1] === h[1]);
        return (
          <g key={`${h[0]},${h[1]}`} aria-hidden="true">
            <rect x={cx - 24} y={cy - 24} width="48" height="48" fill="#0b0f26" />
            <rect x={cx - 22} y={cy - 22} width="44" height="44" fill="none" stroke={C.amber} strokeWidth="5" />
            <line x1={cx - 11} y1={cy + 4} x2={cx + 4} y2={cy - 11} stroke={C.amber} strokeWidth="5" />
            <line x1={cx - 4} y1={cy + 11} x2={cx + 11} y2={cy - 4} stroke={C.amber} strokeWidth="5" />
            {isClosed && <><rect x={cx - 22} y={cy - 22} width="44" height="44" fill="#6b7499" stroke={C.text} strokeWidth="2" /><rect x={cx - 14} y={cy - 4} width="28" height="8" fill={C.green} /></>}
          </g>
        );
      })}
      {/* аптечка */}
      {!medkit && (() => { const [cx, cy] = center(init.medkit); return (
        <g className="bg-bob" aria-hidden="true">
          <rect x={cx - 18} y={cy - 15} width="36" height="30" rx="6" fill="#fff" />
          <rect x={cx - 3.75} y={cy - 10.5} width="7.5" height="21" fill={C.red} />
          <rect x={cx - 10.5} y={cy - 3.75} width="21" height="7.5" fill={C.red} />
        </g>
      ); })()}
      {/* маршрут і мітка */}
      {route.map((p) => { const [cx, cy] = center(p); return <circle key={`${p[0]},${p[1]}`} cx={cx} cy={cy} r="4" fill={C.cyan} opacity="0.5" />; })}
      {marker && (() => { const [cx, cy] = center(marker.p); return <circle key={marker.k} cx={cx} cy={cy} r="20" fill="none" stroke={C.cyan} strokeWidth="3" className="bg-fade" />; })()}
      {/* екіпаж і гравець */}
      {crew.map((c) => { const [cx, cy] = center(c.pos); return <Astro key={c.id} x={cx} y={cy} color={c.color} label={t(`games.dash.crew.${c.id}`)} />; })}
      <Astro x={px} y={py} color={C.cyan} label={t('games.dash.you')} you />
      {/* тривога й протони */}
      {!end?.success && <rect x="0" y={OY} width="676" height={9 * T} fill={C.red} className="bg-alarm-tint" pointerEvents="none" />}
      {!end && <g className="bg-protons" aria-hidden="true">{[180, 340, 500, 660, 820, 980, 1140].map((x, i) => <rect key={x} x={x} y="26" width="26" height="3" fill="#ff9fb4" style={{ animationDelay: `${i * 0.18}s` }} />)}</g>}
      {/* HUD */}
      <rect x="0" y="0" width={W} height={OY} fill={C.panel} opacity="0.92" />
      <rect x="0" y={OY + 9 * T} width={W} height={600 - OY - 9 * T} fill={C.panel} opacity="0.92" />
      <text x="18" y="38" className="bg-num" fill={left <= 5 ? C.red : C.text} fontSize="32">{Math.ceil(left)}{t('games.sec')}</text>
      {[
        { x: 118, done: closed.length >= init.hatches.length, label: t('games.dash.hatches', { n: closed.length, of: init.hatches.length }), icon: '🚪' },
        { x: 296, done: medkit, label: t('games.dash.medkit'), icon: '🩹' },
        { x: 474, done: Boolean(end?.success), label: t('games.dash.shelterGoal'), icon: '🛡️' },
      ].map((g) => (
        <g key={g.x}>
          <rect x={g.x} y="17" width="22" height="22" rx="4" fill={g.done ? C.green : 'none'} stroke={g.done ? C.green : C.muted} strokeWidth="2" />
          {g.done && <path d={`M${g.x + 5} ${28} l5 5 l8 -10`} stroke={C.space0} strokeWidth="3" fill="none" />}
          <text x={g.x + 30} y="36" fontSize="18">{g.icon}</text>
          <text x={g.x + 56} y="35" fontSize="17" fill={g.done ? C.green : C.text}>{g.label}</text>
        </g>
      ))}
      <text x="660" y="24" fontSize="16" fontWeight="700" fill={C.text}>{t('games.dash.dose', { d: dose.toFixed(1) })}</text>
      <rect x="660" y="34" width="200" height="12" fill={C.space0} stroke={C.line} strokeWidth="2" />
      <rect x="660" y="34" width={200 * Math.min(1, dose / 10)} height="12" fill={dose < 3 ? C.green : dose < 6 ? C.amber : C.red} />
      <text x="480" y="584" textAnchor="middle" fontSize="18" fill={C.text}>{t(`games.dash.hint.${hint}`)}</text>
      {end && (
        <text x="480" y="320" textAnchor="middle" className="bg-banner" fontSize="64" fill={end.success ? C.green : C.amber} stroke={C.space0} strokeWidth="8" paintOrder="stroke">
          {end.success ? t('games.dash.safe') : t('games.time_up')}
        </text>
      )}
    </svg>
  );
}

export default function ShelterDash({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const limit = CONFIG.games.seconds.dash;
  return (
    <BigGame id="dash" t={t} seconds={limit} urgent title={t('games.dash.title')}>
      <Game t={t} v={v} seed={9001 + variant * 53} limit={limit} onDone={onDone} />
    </BigGame>
  );
}
