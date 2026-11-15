// «Панельний патруль» (з MoonShift): змети пил із сонячних панелей і наведи кожну на Сонце.
// Потужність = чистота × наведення; 80 % — перемога. Щоразу інше: положення Сонця, кількість панелей, скільки пилу.
import { useMemo, useRef, useState } from 'react';
import BigGame from './BigGame.jsx';
import SpaceBg from './SpaceBg.jsx';
import { C, W, clamp, mulberry32, toSvg, useTicker } from './kit.js';
import { pickVariant } from '../variant.js';
import { play } from '../../sfx.js';
import { CONFIG } from '../../../game/config.js';

const HORIZON = 400;
const PY = 310;
const PH = 66;
const CELL = 12;
const ROWS = 6;
const MAX_TILT = (85 * Math.PI) / 180;
const KNOB = 18;
const WIN = 0.8;
const R = 24; // радіус щітки

const VARIANTS = [
  { d: 0.2, hour: 9 },
  { d: 0.4, hour: 13 },
  { d: 0.55, hour: 16 },
  { d: 0.7, hour: 10.5 },
  { d: 0.85, hour: 15 },
];

function setup(v, seed) {
  const rnd = mulberry32(seed);
  const tt = clamp((v.hour - 6) / 12, 0.03, 0.97);
  const sun = { x: 50 + 860 * tt, y: 360 - Math.sin(Math.PI * tt) * 210 };
  const many = v.d >= 0.5;
  const n = many ? 5 : 4;
  const w = many ? 126 : 150;
  const gap = many ? 186 : 225;
  const x0 = many ? 108 : 142.5;
  const cols = Math.round(w / CELL);
  const film = 0.2 + 0.25 * v.d;
  const panels = Array.from({ length: n }, (_, i) => {
    const x = x0 + gap * i;
    const ideal = clamp(Math.atan2(sun.x - x, PY - sun.y), -MAX_TILT, MAX_TILT);
    const off = (0.45 + rnd() * 0.5) * (rnd() < 0.5 ? -1 : 1);
    let tilt = clamp(ideal + off, -MAX_TILT, MAX_TILT);
    if (Math.abs(tilt - ideal) < 0.3) tilt = clamp(ideal - off, -MAX_TILT, MAX_TILT);
    const blobs = Array.from({ length: 3 + Math.round(4 * v.d) }, () => ({
      x: (rnd() - 0.5) * w, y: (rnd() - 0.5) * PH, r: 14 + rnd() * 26,
    }));
    const dust = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = -w / 2 + (c + 0.5) * CELL;
        const cy = -PH / 2 + (r + 0.5) * (PH / ROWS);
        let val = film + rnd() * 0.2;
        for (const b of blobs) val += Math.max(0, 1 - Math.hypot(cx - b.x, cy - b.y) / b.r) * 1.2;
        dust.push(Math.min(1, val));
      }
    }
    return { x, w, cols, ideal, tilt, dust, wiped: false, sparkled: false };
  });
  return { sun, panels, earth: sun.x > 480 ? { x: 230, y: 190 } : { x: 730, y: 190 } };
}

const cleanOf = (p) => (p.wiped ? 1 : 1 - p.dust.reduce((a, b) => a + b, 0) / p.dust.length);
const aimOf = (p) => Math.max(0, Math.cos(p.tilt - p.ideal));
const toneOf = (v) => (v >= 0.8 ? C.green : v >= 0.5 ? C.amber : C.red);

function Game({ t, v, seed, limit, onDone }) {
  const init = useMemo(() => setup(v, seed), [v, seed]);
  const [panels, setPanels] = useState(init.panels);
  const panelsRef = useRef(init.panels);
  const [time, setTime] = useState(0);
  const [brush, setBrush] = useState(null);
  const [selected, setSelected] = useState(0);
  const [end, setEnd] = useState(null);
  const svg = useRef(null);
  const drag = useRef(null); // { type: 'tilt', i } | { type: 'brush', last }
  const lastTick = useRef(-1);
  const strength = 0.13 - 0.05 * v.d;

  const commit = (next) => {
    panelsRef.current = next;
    setPanels(next);
  };

  const power = panels.reduce((a, p) => a + cleanOf(p) * aimOf(p), 0) / panels.length;

  const ended = useRef(false);
  const finish = (success, score) => {
    if (ended.current) return;
    ended.current = true;
    setEnd({ success });
    play(success ? 'good' : 'bad');
    setTimeout(() => onDone({ success, score: Math.round(score * 100) / 100 }), 1100);
  };

  const after = (next) => {
    let pw = 0;
    const out = next.map((p) => {
      let q = p;
      if (!q.wiped && cleanOf(q) >= 0.97) {
        q = { ...q, wiped: true, dust: q.dust.map(() => 0) };
        play('pop');
      }
      const o = cleanOf(q) * aimOf(q);
      if (o >= 0.9 && !q.sparkled) q = { ...q, sparkled: true };
      pw += o;
      return q;
    });
    commit(out);
    if (pw / out.length >= WIN) finish(true, pw / out.length);
  };

  const brushAt = (pt, amount) => {
    const next = panelsRef.current.map((p) => {
      if (p.wiped) return p;
      const dx = pt.x - p.x;
      const dy = pt.y - PY;
      const lx = dx * Math.cos(-p.tilt) - dy * Math.sin(-p.tilt);
      const ly = dx * Math.sin(-p.tilt) + dy * Math.cos(-p.tilt);
      if (Math.abs(lx) > p.w / 2 + R || Math.abs(ly) > PH / 2 + R) return p;
      let changed = false;
      const dust = p.dust.map((d, k) => {
        if (d <= 0) return d;
        const c = k % p.cols;
        const r = Math.floor(k / p.cols);
        const cx = -p.w / 2 + (c + 0.5) * CELL;
        const cy = -PH / 2 + (r + 0.5) * (PH / ROWS);
        const dist = Math.hypot(lx - cx, ly - cy);
        if (dist > R) return d;
        changed = true;
        return Math.max(0, d - amount * (1 - (0.5 * dist) / R));
      });
      return changed ? { ...p, dust } : p;
    });
    after(next);
  };

  const knobAt = (pt) => panelsRef.current.findIndex((p) => {
    const kx = p.x + Math.cos(p.tilt) * (p.w / 2 + KNOB);
    const ky = PY + Math.sin(p.tilt) * (p.w / 2 + KNOB);
    return Math.hypot(pt.x - kx, pt.y - ky) < 30;
  });

  const setTilt = (i, a) => {
    let ang = a;
    if (ang > Math.PI / 2) ang -= Math.PI;
    if (ang < -Math.PI / 2) ang += Math.PI;
    const next = panelsRef.current.map((p, k) => (k === i ? { ...p, tilt: clamp(ang, -MAX_TILT, MAX_TILT) } : p));
    after(next);
  };

  const down = (e) => {
    if (end) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* нічого */ }
    const pt = toSvg(svg.current, e);
    const k = knobAt(pt);
    if (k >= 0) {
      play('click');
      setSelected(k);
      drag.current = { type: 'tilt', i: k };
      return;
    }
    drag.current = { type: 'brush', last: pt };
    setBrush(pt);
    brushAt(pt, strength);
  };
  const move = (e) => {
    const pt = toSvg(svg.current, e);
    setBrush(pt);
    const d = drag.current;
    if (!d || end) return;
    if (d.type === 'tilt') {
      const p = panelsRef.current[d.i];
      setTilt(d.i, Math.atan2(pt.y - PY, pt.x - p.x));
      return;
    }
    const steps = Math.max(1, Math.ceil(Math.hypot(pt.x - d.last.x, pt.y - d.last.y) / (R * 0.4)));
    for (let s = 1; s <= steps; s++) {
      brushAt({ x: d.last.x + ((pt.x - d.last.x) * s) / steps, y: d.last.y + ((pt.y - d.last.y) * s) / steps }, strength);
    }
    d.last = pt;
  };
  const up = () => { drag.current = null; };

  const onKey = (e) => {
    if (end) return;
    const n = Number(e.key);
    if (n >= 1 && n <= panels.length) { setSelected(n - 1); return; }
    const p = panelsRef.current[selected];
    if (e.key === 'q' || e.key === 'Q' || e.key === 'й' || e.key === 'Й') { e.preventDefault(); setTilt(selected, p.tilt - 0.08); }
    if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У') { e.preventDefault(); setTilt(selected, p.tilt + 0.08); }
    if (e.key === ' ') {
      e.preventDefault();
      // клавіатура: пробіл чистить вибрану панель
      const next = panelsRef.current.map((q, k) => (k === selected ? { ...q, dust: q.dust.map((d) => Math.max(0, d - 0.15)) } : q));
      after(next);
    }
    if (e.key === 'Tab') { e.preventDefault(); setSelected((s) => (s + (e.shiftKey ? panels.length - 1 : 1)) % panels.length); }
  };

  useTicker((dt, elapsed) => {
    if (end) return;
    setTime(elapsed);
    const left = limit - elapsed;
    if (left <= 5 && Math.ceil(left) !== lastTick.current) {
      lastTick.current = Math.ceil(left);
      play('tick');
    }
    if (elapsed >= limit) {
      const pw = panelsRef.current.reduce((a, p) => a + cleanOf(p) * aimOf(p), 0) / panelsRef.current.length;
      finish(false, pw); // не встиг до 80% — панелі дадуть лише частину енергії
    }
  }, !end);

  const left = Math.max(0, limit - time);
  const pct = Math.round(power * 100);
  const timeColor = left <= 5 ? C.red : left <= 10 ? C.amber : C.cyan;

  return (
    <svg ref={svg} className="bg-svg" viewBox={`0 0 ${W} 600`} tabIndex={0} role="application" aria-label={t('games.patrol.hint')}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerLeave={() => setBrush(null)} onKeyDown={onKey}>
      <SpaceBg seed={seed} horizonY={HORIZON} id="pp" />
      {/* Сонце, Земля, промені */}
      <g aria-hidden="true">
        {[74, 61, 48, 35].map((r) => <circle key={r} cx={init.sun.x} cy={init.sun.y} r={r} fill={C.sun} opacity="0.07" />)}
        <circle cx={init.sun.x} cy={init.sun.y} r="24" fill={C.sun} />
        <circle cx={init.sun.x} cy={init.sun.y} r="13" fill="#fff" opacity="0.7" />
        <circle cx={init.earth.x} cy={init.earth.y} r="13" fill={C.earthBlue} />
        <ellipse cx={init.earth.x - 3} cy={init.earth.y - 5} rx="6" ry="2" fill="#fff" opacity="0.75" />
        {panels.map((p) => <line key={p.x} x1={init.sun.x} y1={init.sun.y} x2={p.x} y2={PY} stroke={C.sun} strokeWidth="3" opacity="0.22" />)}
      </g>
      {/* Панелі */}
      {panels.map((p, i) => {
        const clean = cleanOf(p);
        const out = clean * aimOf(p);
        const status = clean < 0.9 ? 'dusty' : aimOf(p) < 0.95 ? 'aim' : 'great';
        return (
          <g key={p.x}>
            <rect x={p.x - 5} y={PY} width="10" height="140" fill={C.regolithDark} />
            <ellipse cx={p.x} cy={452} rx="23" ry="5" fill="#34323f" opacity="0.6" />
            <g transform={`translate(${p.x} ${PY}) rotate(${(p.tilt * 180) / Math.PI})`}>
              <rect x={-p.w / 2 - 12} y={-45} width={p.w + 24} height="90" rx="16" fill={C.cyan} opacity={out * out} />
              <rect x={-p.w / 2 - 4} y={-PH / 2 - 4} width={p.w + 8} height={PH + 8} rx="5" fill="#8a93b8" />
              <rect x={-p.w / 2} y={-PH / 2} width={p.w} height={PH} fill={C.solar} />
              <line x1={-p.w / 2} y1="0" x2={p.w / 2} y2="0" stroke="#173080" />
              {Array.from({ length: Math.floor(p.w / 21) }, (_, k) => (
                <line key={k} x1={-p.w / 2 + 21 * (k + 1)} y1={-PH / 2} x2={-p.w / 2 + 21 * (k + 1)} y2={PH / 2} stroke="#173080" />
              ))}
              <rect x={-p.w / 2} y={-PH / 2} width={p.w} height={PH} fill="#9fe8ff" opacity={out * 0.4} />
              {p.dust.map((d, k) => (d < 0.03 ? null : (
                <circle key={k} cx={-p.w / 2 + ((k % p.cols) + 0.5) * CELL} cy={-PH / 2 + (Math.floor(k / p.cols) + 0.5) * (PH / ROWS)}
                  r={7 * (0.55 + 0.45 * d)} fill={k % 3 === 0 ? '#c2b59c' : C.dust} opacity={Math.min(1, 0.15 + d)} />
              )))}
              {selected === i && <rect x={-p.w / 2 - 8} y={-41} width={p.w + 16} height="82" rx="9" fill="none" stroke={C.text} strokeWidth="3" opacity="0.5" />}
              {/* стрілка-нормаль і ручка */}
              <line x1="0" y1={-PH / 2 - 4} x2="0" y2={-PH / 2 - 40} stroke={C.cyan} strokeWidth="3" opacity="0.9" />
              <polygon points={`0,${-PH / 2 - 50} -7,${-PH / 2 - 38} 7,${-PH / 2 - 38}`} fill={C.cyan} opacity="0.9" />
              <line x1={p.w / 2} y1="0" x2={p.w / 2 + KNOB} y2="0" stroke="#8a93b8" strokeWidth="4" />
              <circle cx={p.w / 2 + KNOB} cy="0" r="13" fill={C.amber} stroke="#fff" strokeWidth="2" />
              <circle cx={p.w / 2 + KNOB} cy="0" r="4" fill="#7a4a00" />
            </g>
            <text x={p.x} y="474" textAnchor="middle" className="bg-num" fill={toneOf(out)} fontSize="26" stroke={C.space0} strokeWidth="5" paintOrder="stroke">{Math.round(out * 100)}%</text>
            <text x={p.x} y="500" textAnchor="middle" fill={status === 'great' ? C.green : C.amber} fontSize="18" stroke={C.space0} strokeWidth="4" paintOrder="stroke">{t(`games.patrol.${status}`)}</text>
            {p.sparkled && <text x={p.x + p.w / 2 - 10} y={PY - 40} fontSize="22" aria-hidden="true">✨</text>}
          </g>
        );
      })}
      {brush && !end && <circle cx={brush.x} cy={brush.y} r={R} fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" pointerEvents="none" />}
      {/* HUD */}
      <rect x="16" y="8" width="928" height="10" rx="5" fill={C.panel} opacity="0.9" />
      <rect x="16" y="8" width={Math.max(10, (928 * left) / limit)} height="10" rx="5" fill={timeColor} />
      <text x="80" y="34" textAnchor="middle" fill={C.muted} fontSize="18">{t('games.patrol.power')}</text>
      <text x="80" y="76" textAnchor="middle" className="bg-num" fill={toneOf(power)} fontSize="44">{pct}%</text>
      <rect x="150" y="50" width="420" height="26" rx="8" fill={C.panel} />
      <rect x="150" y="50" width={Math.max(16, 420 * power)} height="26" rx="8" fill={toneOf(power)} />
      <line x1="486" y1="44" x2="486" y2="82" stroke="#fff" strokeWidth="3" />
      <text x="486" y="100" textAnchor="middle" fill={C.text} fontSize="16">{t('games.patrol.goal')}</text>
      <text x="940" y="36" textAnchor="end" className="bg-num" fill={left <= 5 ? C.red : C.text} fontSize="28">{Math.ceil(left)}{t('games.sec')}</text>
      <text x="480" y="552" textAnchor="middle" fill={C.text} fontSize="18" stroke={C.space0} strokeWidth="4" paintOrder="stroke">{t('games.patrol.hint')}</text>
      <text x="480" y="578" textAnchor="middle" fill={C.muted} fontSize="16" stroke={C.space0} strokeWidth="4" paintOrder="stroke">{t('games.patrol.keys', { n: panels.length })}</text>
      {end && (
        <text x="480" y="230" textAnchor="middle" className="bg-banner" fill={end.success ? C.green : C.amber} fontSize="44" stroke={C.space0} strokeWidth="6" paintOrder="stroke">
          {end.success ? t('games.patrol.restored') : t('games.time_up')}
        </text>
      )}
    </svg>
  );
}

export default function PanelPatrol({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const limit = CONFIG.games.seconds.patrol;
  return (
    <BigGame id="patrol" t={t} seconds={limit} title={t('games.patrol.title')}>
      <Game t={t} v={v} seed={4242 + variant * 97} limit={limit} onDone={onDone} />
    </BigGame>
  );
}
