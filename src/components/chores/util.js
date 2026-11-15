// Допоміжне для міні-ігор.
import { useCallback, useEffect, useRef, useState } from 'react';
import { play } from '../sfx.js';

const DONE_DELAY_MS = 450;

/** Завершення гри: один раз звук успіху, ✅ і onDone після короткої паузи. */
export function useFinish(onDone) {
  const [done, setDone] = useState(false);
  const fired = useRef(false);
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const finish = useCallback(() => {
    if (fired.current) return;
    fired.current = true;
    setDone(true);
    play('select');
    timer.current = setTimeout(onDone, DONE_DELAY_MS);
  }, [onDone]);
  return [done, finish];
}

/** Чи точка над елементом. */
export function isOver(el, p) {
  const r = el?.getBoundingClientRect();
  return Boolean(r) && p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
}

/** Захопити вказівник, щоб рух рахувався, навіть якщо палець вийшов за межі елемента. Без помилок, якщо не вийшло. */
export function capture(e) {
  try {
    e.currentTarget.setPointerCapture?.(e.pointerId);
  } catch {
    // вказівник уже відпущено — нічого страшного
  }
}
