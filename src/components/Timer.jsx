// Власник: Dev 4. Таймер дилеми: товста смужка, що тане, + секунди. Останні 5 секунд — «тік».
// Пропси: seconds — скільки секунд, onTimeout — що зробити, коли час вийшов, paused — пауза (інструкція), t — переклад.
import { useEffect, useRef, useState } from 'react';
import { play } from './sfx.js';

export default function Timer({ seconds = 15, onTimeout, paused = false, t }) {
  const [left, setLeft] = useState(seconds);

  // Зберігаємо останню версію onTimeout, щоб відлік не перезапускався при кожному рендері
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Щосекунди мінус 1; на нулі викликаємо onTimeout
  useEffect(() => {
    if (paused) return undefined;
    if (left <= 0) {
      onTimeoutRef.current?.();
      return undefined;
    }
    const id = setTimeout(() => {
      setLeft((s) => s - 1);
      if (left <= 6) play('tick');
    }, 1000);
    return () => clearTimeout(id);
  }, [left, paused]);

  const tone = left > seconds / 2 ? 'ok' : left > 5 ? 'warn' : 'danger';

  return (
    <div className="timer" data-tone={tone} data-paused={paused || undefined} role="timer" aria-live="off" aria-label={t('decision.timer', { n: left })}>
      <span className="timer__icon" aria-hidden="true">⏱️</span>
      <span className="timer__track" aria-hidden="true">
        <span className="timer__fill" style={{ '--left': left / seconds }} />
      </span>
      <span className="timer__num" aria-hidden="true">{left}</span>
    </div>
  );
}
