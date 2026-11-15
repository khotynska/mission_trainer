// Маленьке завдання для спокійного дня: торкнись усіх предметів (овочі, пил, цеглини, зорі…).
// Ніякого таймера й очікування: кожен дотик — звук і «пух», коли зібрано все — справу зроблено.
import { useRef, useState } from 'react';
import { play } from './sfx.js';
import '../styles/tap-task.css';

/** Стабільні «випадкові» місця предметів (без Math.random у рендері). */
const SPOTS = [[14, 30], [42, 62], [70, 26], [28, 74], [84, 66], [56, 40], [10, 58]];
const DONE_DELAY_MS = 250;

/**
 * @param {{ icon: string, title: string, targets: string[], t: Function, onDone: () => void }} props
 */
export default function TapTask({ icon, title, targets, t, onDone }) {
  const [left, setLeft] = useState(() => targets.map((_, i) => i));
  const finished = useRef(false);
  const total = targets.length;
  const done = total - left.length;

  const tap = (i) => {
    if (finished.current) return;
    play('click');
    const next = left.filter((x) => x !== i);
    setLeft(next);
    if (next.length === 0) {
      finished.current = true;
      play('select');
      setTimeout(onDone, DONE_DELAY_MS);
    }
  };

  return (
    <section className="tap-task" aria-label={title}>
      <p className="tap-task__title">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      <div className="tap-task__field">
        {targets.map((emoji, i) => {
          const [x, y] = SPOTS[i % SPOTS.length];
          const gone = !left.includes(i);
          return (
            <button
              key={i}
              type="button"
              className="tap-task__item"
              data-sfx="none"
              data-gone={gone || undefined}
              disabled={gone}
              style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.15}s` }}
              aria-label={`${emoji} ${i + 1}`}
              onClick={() => tap(i)}
            >
              {emoji}
            </button>
          );
        })}
        {left.length === 0 && <span className="tap-task__done" aria-hidden="true">✅</span>}
      </div>
      <div className="tap-task__progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <span style={{ '--p': done / total }} />
        <b>{left.length === 0 ? t('decision.task_done') : t('decision.task_progress', { n: done, total })}</b>
      </div>
    </section>
  );
}
