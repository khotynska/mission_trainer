// Спільне для великих міні-ігор (перенесені з MoonShift): сцена 960×600, кольори, випадковість із «зерном», ігровий цикл.
import { useEffect, useRef } from 'react';

export const W = 960;
export const H = 600;

/** Палітра MoonShift (theme.ts). Це кольори ілюстрації, тому літерали тут дозволені. */
export const C = {
  space0: '#050714', space1: '#0a0f2c', space2: '#141b45', panel: '#121a3f', line: '#3a4a8a',
  text: '#eef2ff', muted: '#9aa6cf', cyan: '#4de1ff', violet: '#8b7bff', green: '#5cf2a6',
  amber: '#ffb547', red: '#ff5577', sun: '#ffd36b', regolith: '#8d8a99', regolithDark: '#4a4858',
  regolithLight: '#b9b5c6', solar: '#2b5bd7', earthBlue: '#3d8bff', dust: '#9c8f7a',
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Детермінована випадковість (mulberry32): однаковий варіант — однакова розкладка. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Координати вказівника в системі SVG (viewBox 960×600). */
export function toSvg(svg, e) {
  const r = svg.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
}

/** Ігровий цикл: cb(dt у секундах, elapsed) кожен кадр, поки running. */
export function useTicker(cb, running) {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  });
  useEffect(() => {
    if (!running) return undefined;
    let raf = 0;
    let last = performance.now();
    const start = last;
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      cbRef.current(dt, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

export const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
