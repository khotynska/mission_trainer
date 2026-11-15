// «Налаштуй сигнал» (з MoonShift): спалах заглушив радіо — сумісти свою хвилю (ТИ) з хвилею ЗЕМЛЯ.
// Тягни повзунки частоти й амплітуди (або ← → і ↑ ↓) і втримай фіксацію 2,5 с — повідомлення розшифрується.
// Щоразу інше: інша хвиля Землі, інше повідомлення, а пізніше сигнал ще й «пливе».
import { useMemo, useRef, useState } from 'react';
import BigGame from './BigGame.jsx';
import SpaceBg from './SpaceBg.jsx';
import { C, W, clamp, mulberry32, reducedMotion, toSvg, useTicker } from './kit.js';
import { pickVariant } from '../variant.js';
import { play } from '../../sfx.js';
import { CONFIG } from '../../../game/config.js';

const SX = 160;
const SY = 44;
const SW = 640;
const SH = 300;
const MID = 194;
const N = 128;
const TX0 = 250;
const TX1 = 860;
const ROW = { freq: 468, amp: 548 };
const LOCK_NEED = 2.5;
const GLYPHS = '#%&@$*?!/<>=+~01';

const VARIANTS = [
  { key: 'control', d: 0.3, sev: 2 },
  { key: 'family', d: 0.55, sev: 3 },
  { key: 'forecast', d: 0.75, sev: 3 },
];

const freqOf = (u) => 1 + 4 * u;
const ampOf = (v) => (0.15 + 0.8 * v) * 118;
const waveY = (u, v, i, phase, noise = 0) => clamp(MID - ampOf(v) * Math.sin(2 * Math.PI * freqOf(u) * (i / (N - 1)) + phase) + noise, 52, 336);

function Game({ t, v, seed, limit, onDone }) {
  const init = useMemo(() => {
    const rnd = mulberry32(seed);
    const baseU = 0.15 + rnd() * 0.7;
    const baseV = 0.2 + rnd() * 0.65;
    const away = (b) => clamp(b + (b < 0.5 ? 1 : -1) * (0.35 + rnd() * 0.1), 0, 1);
    const ranks = Array.from({ length: 200 }, () => rnd());
    return { baseU, baseV, u: away(baseU), v: away(baseV), ranks };
  }, [seed]);
  const message = t(`games.signal.msg.${v.key}`);
  const [ctrl, setCtrl] = useState({ u: init.u, v: init.v });
  const ctrlRef = useRef(ctrl);
  const [view, setView] = useState({ tu: init.baseU, tv: init.baseV, match: 0, lock: 0, locked: false, phase: 0, time: 0, noise: [], noise2: [], reveal: 0, garble: 0 });
  const [end, setEnd] = useState(null);
  const ended = useRef(false);
  const svg = useRef(null);
  const st = useRef({ lock: 0, locked: false, best: 0, keys: {}, holdT: {}, lastTenth: -1, lastTick: 0, lastChime: -9, noiseT: 0, noise: [], noise2: [], decode: null, garbleT: 0, garble: 0, dragging: {} });
  const rm = reducedMotion();
  const drift = v.d > 0.5 ? (v.d - 0.5) * 0.18 : 0;
  const tolBase = Math.min(0.08, 0.05 - 0.01 * v.d);

  const setC = (next) => { ctrlRef.current = next; setCtrl(next); };

  useTicker((dt, elapsed) => {
    const s = st.current;
    if (s.decode) {
      s.decode.t += dt;
      const reveal = Math.min(message.length, Math.floor(s.decode.t / 0.03));
      setView((vv) => ({ ...vv, reveal }));
      if (reveal >= message.length && !s.decode.done) {
        s.decode.done = true;
        play('good');
        const used = s.decode.at;
        setTimeout(() => onDone({ success: true, score: Math.round(clamp(1 - (0.5 * used) / limit, 0.5, 1) * 100) / 100 }), 900);
      }
      return;
    }
    if (ended.current) return;
    if (elapsed >= limit) {
      ended.current = true;
      setEnd({ success: false });
      play('bad');
      onDone({ success: false, score: Math.round(s.best * 0.5 * 100) / 100 });
      return;
    }
    // клавіатура: ← → частота, ↑ ↓ амплітуда (утримання прискорює)
    let { u, v: vv } = ctrlRef.current;
    for (const [k, axis, sign] of [['ArrowLeft', 'u', -1], ['ArrowRight', 'u', 1], ['ArrowDown', 'v', -1], ['ArrowUp', 'v', 1]]) {
      if (!s.keys[k] || s.dragging[axis]) continue;
      s.holdT[k] = (s.holdT[k] ?? 0) + dt;
      const speed = Math.min(0.6, 0.1 + 0.5 * s.holdT[k]);
      if (axis === 'u') u = clamp(u + sign * speed * dt, 0, 1);
      else vv = clamp(vv + sign * speed * dt, 0, 1);
    }
    if (u !== ctrlRef.current.u || vv !== ctrlRef.current.v) setC({ u, v: vv });
    const tu = clamp(init.baseU + drift * Math.sin(0.45 * elapsed), 0, 1);
    const tv = clamp(init.baseV + 0.6 * drift * Math.sin(0.31 * elapsed + 1.7), 0, 1);
    const du = Math.abs(u - tu);
    const dv = Math.abs(vv - tv);
    const match = clamp(1 - (du + dv) / 0.9, 0, 1);
    s.best = Math.max(s.best, match);
    const tol = s.locked ? tolBase * 1.25 : tolBase;
    const locked = du < tol && dv < tol;
    if (locked && !s.locked && elapsed - s.lastChime > 1.5) { play('chime'); s.lastChime = elapsed; }
    s.locked = locked;
    s.lock = locked ? s.lock + dt : Math.max(0, s.lock - 0.5 * dt);
    const tenth = Math.floor(match * 10);
    if (tenth !== s.lastTenth && elapsed - s.lastTick > 0.18) { play('tick'); s.lastTick = elapsed; s.lastTenth = tenth; s.garble += 1; }
    // шум
    s.noiseT += dt;
    const level = (0.35 + 0.13 * v.sev) * (1 - match);
    if (s.noiseT > 0.07 || !s.noise.length) {
      if (!rm || !s.noise.length) {
        s.noise = Array.from({ length: N }, () => (Math.random() * 2 - 1));
        s.noise2 = Array.from({ length: N }, () => (Math.random() * 2 - 1));
      }
      s.noiseT = 0;
    }
    s.garbleT += dt;
    if (!rm && s.garbleT > 0.4) { s.garbleT = 0; s.garble += 1; }
    if (s.lock >= LOCK_NEED) {
      // перемога: розшифровуємо повідомлення
      ended.current = true;
      s.decode = { t: 0, at: elapsed, done: false };
      setC({ u: tu, v: tv });
      setEnd({ success: true });
    }
    setView({ tu, tv, match, lock: s.lock, locked, phase: rm ? 0 : elapsed * 2.2, time: elapsed, noise: s.noise.map((n) => n * level * 34), noise2: s.noise2.map((n) => n * level * 34), reveal: 0, garble: s.garble, level });
  }, true);

  const garbled = useMemo(() => [...message].map((ch, i) => {
    if (ch === ' ') return ' ';
    if (end?.success && i < view.reveal) return ch;
    if (end?.success) return GLYPHS[(i * 7 + view.garble) % GLYPHS.length];
    if (init.ranks[i % init.ranks.length] < view.match * 0.45) return ch;
    return GLYPHS[(i * 7 + view.garble * 3) % GLYPHS.length];
  }).join(''), [message, view.match, view.garble, view.reveal, end, init.ranks]);

  const sliderAt = (axis, x) => {
    const val = clamp((x - TX0) / (TX1 - TX0), 0, 1);
    setC({ ...ctrlRef.current, [axis]: val });
  };
  const down = (e) => {
    if (ended.current) return;
    const pt = toSvg(svg.current, e);
    const axis = Math.abs(pt.y - ROW.freq) < 38 ? 'u' : Math.abs(pt.y - ROW.amp) < 38 ? 'v' : null;
    if (!axis || pt.x < TX0 - 40 || pt.x > TX1 + 40) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* нічого */ }
    st.current.dragging[axis] = e.pointerId;
    sliderAt(axis, pt.x);
  };
  const move = (e) => {
    const d = st.current.dragging;
    const axis = d.u === e.pointerId ? 'u' : d.v === e.pointerId ? 'v' : null;
    if (!axis || ended.current) return;
    sliderAt(axis, toSvg(svg.current, e).x);
  };
  const up = (e) => {
    const d = st.current.dragging;
    if (d.u === e.pointerId) delete d.u;
    if (d.v === e.pointerId) delete d.v;
  };
  const keyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const s = st.current;
    if (!e.repeat) {
      const nudge = { ArrowLeft: ['u', -0.008], ArrowRight: ['u', 0.008], ArrowDown: ['v', -0.008], ArrowUp: ['v', 0.008] }[e.key];
      setC({ ...ctrlRef.current, [nudge[0]]: clamp(ctrlRef.current[nudge[0]] + nudge[1], 0, 1) });
    }
    s.keys[e.key] = true;
  };
  const keyUp = (e) => { st.current.keys[e.key] = false; st.current.holdT[e.key] = 0; };

  const left = Math.max(0, limit - view.time);
  const frac = left / limit;
  const pathOf = (u, vv, noise) => Array.from({ length: N }, (_, i) => `${i ? 'L' : 'M'}${(176 + (608 * i) / (N - 1)).toFixed(1)} ${waveY(u, vv, i, view.phase, noise[i] ?? 0).toFixed(1)}`).join(' ');
  const locked = view.locked || end?.success;
  const earthColor = locked ? C.green : C.cyan;
  const youColor = locked ? C.green : C.amber;
  const hint = end?.success ? 'decode' : view.locked ? (drift > 0 ? 'drift' : 'hold') : view.lock > 0 ? 'slip' : 'start';

  return (
    <svg ref={svg} className="bg-svg" viewBox={`0 0 ${W} 600`} tabIndex={0} role="application" aria-label={t('games.signal.title')}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={keyDown} onKeyUp={keyUp}>
      <SpaceBg seed={seed} id="st" />
      {/* пульти */}
      <rect x="16" y="44" width="128" height="300" rx="14" fill={C.panel} opacity="0.92" stroke={C.line} strokeWidth="2" />
      <rect x="816" y="44" width="128" height="300" rx="14" fill={C.panel} opacity="0.92" stroke={C.line} strokeWidth="2" />
      <rect x="16" y="354" width="928" height="36" rx="10" fill={C.panel} opacity="0.92" stroke={C.line} strokeWidth="2" />
      <rect x="16" y="424" width="928" height="168" rx="14" fill={C.panel} opacity="0.92" stroke={C.line} strokeWidth="2" />
      {/* Земля й антена */}
      <circle cx="80" cy="100" r="34" fill={C.earthBlue} />
      <ellipse cx="70" cy="90" rx="14" ry="9" fill={C.green} opacity="0.75" />
      <ellipse cx="94" cy="114" rx="9" ry="11" fill={C.green} opacity="0.75" />
      <line x1="80" y1="142" x2="80" y2="236" stroke={locked ? C.green : C.red} strokeOpacity={locked ? 1 : 0.6} strokeWidth="3" strokeDasharray="8 6" />
      <line x1="80" y1="254" x2="80" y2="326" stroke={C.muted} strokeWidth="4" />
      <path d="M44 262 A36 36 0 0 0 116 262 Z" fill={C.regolithLight} />
      <circle cx="80" cy="250" r="5" fill={C.text} />
      <rect x="60" y="324" width="40" height="8" fill={C.text} />
      {/* осцилограф */}
      <rect x={SX - 8} y={SY - 6} width={SW + 16} height={SH + 12} rx="22" fill="#1b2452" />
      <rect x={SX} y={SY} width={SW} height={SH} rx="18" fill="#04121a" />
      {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={SX + 64 * (i + 1)} y1={SY} x2={SX + 64 * (i + 1)} y2={SY + SH} stroke={C.line} strokeOpacity="0.3" />)}
      {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1={SX} y1={SY + 50 * (i + 1)} x2={SX + SW} y2={SY + 50 * (i + 1)} stroke={C.line} strokeOpacity={i === 2 ? 0.6 : 0.3} />)}
      {locked && <path d={pathOf(view.tu, view.tv, [])} fill="none" stroke={C.green} strokeWidth="16" strokeOpacity="0.12" />}
      <path d={pathOf(view.tu, view.tv, view.noise)} fill="none" stroke={earthColor} strokeWidth="3" />
      <path d={pathOf(ctrl.u, ctrl.v, view.noise2)} fill="none" stroke={youColor} strokeWidth="1.5" strokeOpacity="0.4" />
      {Array.from({ length: N / 2 }, (_, k) => {
        const i = k * 2;
        return <circle key={i} cx={176 + (608 * i) / (N - 1)} cy={waveY(ctrl.u, ctrl.v, i, view.phase, view.noise2[i] ?? 0)} r="3" fill={youColor} />;
      })}
      <rect x="170" y="54" width="108" height="60" rx="8" fill="#04121a" opacity="0.8" />
      <line x1="180" y1="70" x2="206" y2="70" stroke={C.cyan} strokeWidth="3" />
      <text x="216" y="76" fontSize="18" fill={C.cyan}>{t('games.signal.earth')}</text>
      {[180, 187, 194, 201].map((x) => <circle key={x} cx={x} cy="98" r="3" fill={C.amber} />)}
      <text x="216" y="104" fontSize="18" fill={C.amber}>{t('games.signal.you')}</text>
      {locked && <text x="782" y="70" textAnchor="end" fontSize="20" fill={C.green}>{t('games.signal.locked')}</text>}
      {Array.from({ length: SH / 4 }, (_, i) => <rect key={`s${i}`} x={SX} y={SY + i * 4} width={SW} height="1" fill="#000" opacity="0.18" />)}
      {/* збіг і фіксація */}
      <text x="880" y="72" textAnchor="middle" fontSize="16" fill={C.muted}>{t('games.signal.match')}</text>
      <text x="880" y="110" textAnchor="middle" className="bg-num" fontSize="38" fill={locked ? C.green : C.amber}>{Math.round((end?.success ? 1 : view.match) * 100)}%</text>
      <text x="880" y="148" textAnchor="middle" fontSize="16" fill={C.muted}>{t('games.signal.lock')}</text>
      <rect x="855" y="160" width="50" height="168" fill={C.space2} />
      <rect x="855" y={160 + 168 * (1 - Math.min(1, view.lock / LOCK_NEED))} width="50" height={168 * Math.min(1, view.lock / LOCK_NEED)} fill={C.green} opacity={locked ? 1 : 0.55} />
      {/* час */}
      <text x="150" y="28" textAnchor="end" fontSize="16" fill={C.muted}>{t('games.signal.time')}</text>
      <rect x="215" y="16" width="575" height="12" fill={C.space2} stroke={C.line} />
      <rect x="215" y="16" width={575 * frac} height="12" fill={frac >= 0.5 ? C.cyan : frac >= 0.25 ? C.amber : C.red} />
      <text x="800" y="28" fontSize="20" fill={C.text} className="bg-num">{Math.ceil(left)}{t('games.sec')}</text>
      {/* повідомлення */}
      <text x="480" y="378" textAnchor="middle" fontSize="20" fill={end?.success ? C.green : end ? C.red : C.muted} className="bg-mono">
        {end && !end.success ? t('games.signal.lost') : garbled}
      </text>
      <text x="480" y="414" textAnchor="middle" fontSize="17" fill={C.muted}>{end && !end.success ? '' : t(`games.signal.hint.${hint}`)}</text>
      {/* повзунки */}
      {[['u', ROW.freq, 'freq', '← →'], ['v', ROW.amp, 'amp', '↑ ↓']].map(([axis, y, label, keys]) => (
        <g key={axis}>
          <text x="32" y={y - 10} fontSize="20" fill={C.text}>{t(`games.signal.${label}`)}</text>
          <text x="32" y={y + 16} fontSize="18" fill={C.muted}>{keys}</text>
          <rect x={TX0 - 6} y={y - 6} width={TX1 - TX0 + 12} height="12" rx="6" fill={C.space2} stroke={C.line} strokeWidth="2" />
          {Array.from({ length: 11 }, (_, i) => <line key={i} x1={TX0 + ((TX1 - TX0) * i) / 10} y1={y + 12} x2={TX0 + ((TX1 - TX0) * i) / 10} y2={y + 20} stroke={C.line} />)}
          <g transform={`translate(${TX0 + (TX1 - TX0) * ctrl[axis]} ${y})`}>
            <rect x="-18" y="-28" width="36" height="56" rx="10" fill={C.amber} stroke={C.text} strokeOpacity="0.9" strokeWidth="2" />
            {[-6, 0, 6].map((dx) => <line key={dx} x1={dx} y1="-12" x2={dx} y2="12" stroke={C.space1} strokeOpacity="0.7" strokeWidth="2" />)}
          </g>
        </g>
      ))}
    </svg>
  );
}

export default function SignalTune({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const limit = CONFIG.games.seconds.signal;
  return (
    <BigGame id="signal" t={t} seconds={limit} title={t('games.signal.title')}>
      <Game t={t} v={v} seed={31337 + variant * 211} limit={limit} onDone={onDone} />
    </BigGame>
  );
}
