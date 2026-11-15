// Звуки гри: синтезуються через Web Audio (без файлів і бібліотек).
// play('good') — коротка мелодія; вимикається кнопкою 🔊 на панелі (state.sound → setSoundEnabled).
// Безпечно: якщо Web Audio немає або браузер блокує звук, гра просто мовчить.

let enabled = true;
let ctx = null;

export function setSoundEnabled(value) {
  enabled = Boolean(value);
}

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Одна нота: частота (Гц), старт і тривалість (с), форма хвилі, гучність, ковзання до частоти. */
function note(ac, { f, at = 0, dur = 0.1, wave = 'square', vol = 0.05, to }) {
  const t0 = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(f, t0);
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;

const SOUNDS = {
  click: [{ f: 880, dur: 0.04, vol: 0.03 }],
  select: [{ f: C5, dur: 0.07 }, { f: G5, at: 0.07, dur: 0.1 }],
  good: [{ f: C5, dur: 0.1 }, { f: E5, at: 0.09, dur: 0.1 }, { f: G5, at: 0.18, dur: 0.1 }, { f: C6, at: 0.27, dur: 0.22, wave: 'triangle', vol: 0.07 }],
  bad: [{ f: 330, dur: 0.16, wave: 'sawtooth', vol: 0.04 }, { f: 247, at: 0.16, dur: 0.28, wave: 'sawtooth', vol: 0.04, to: 180 }],
  alarm: [{ f: 880, dur: 0.12 }, { f: 660, at: 0.16, dur: 0.12 }, { f: 880, at: 0.32, dur: 0.12 }, { f: 660, at: 0.48, dur: 0.12 }],
  tick: [{ f: 1320, dur: 0.03, vol: 0.025 }],
  whoosh: [{ f: 180, dur: 0.45, wave: 'triangle', vol: 0.04, to: 1400 }],
  badge: [{ f: G5, dur: 0.08 }, { f: C6, at: 0.08, dur: 0.08 }, { f: E5 * 2, at: 0.16, dur: 0.08 }, { f: G5 * 2, at: 0.24, dur: 0.3, wave: 'triangle', vol: 0.07 }],
  launch: [{ f: 90, dur: 1.2, wave: 'sawtooth', vol: 0.05, to: 600 }, { f: 180, at: 0.2, dur: 1, wave: 'triangle', vol: 0.04, to: 1200 }],
  // звуки великих міні-ігор (як у MoonShift)
  pop: [{ f: 420, dur: 0.09, wave: 'sine', vol: 0.06, to: 880 }],
  coin: [{ f: 988, dur: 0.07 }, { f: 1319, at: 0.07, dur: 0.12 }],
  chime: [{ f: 880, dur: 0.6, wave: 'sine', vol: 0.05 }, { f: 1320, dur: 0.6, wave: 'sine', vol: 0.04 }],
};

export function play(name) {
  if (!enabled) return;
  const seq = SOUNDS[name];
  if (!seq) return;
  try {
    const ac = audio();
    if (!ac) return;
    seq.forEach((n) => note(ac, n));
  } catch {
    // звук — не головне
  }
}

/** Коротка вібрація на телефоні (якщо є). */
export function buzz(ms = 20) {
  if (!enabled) return;
  try {
    // Браузер дозволяє вібрацію лише після справжнього дотику до сторінки
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate?.(ms);
  } catch {
    // немає вібрації
  }
}
