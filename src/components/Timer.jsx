// Власник: Dev 4. Кругова шкала часу для «Режиму командира».
// Пропси: seconds — скільки секунд, onTimeout — що зробити, коли час вийшов, t — переклад.
import { useEffect, useRef, useState } from 'react';

const R = 26;
const CIRCLE = 2 * Math.PI * R; // довжина кола для анімації

export default function Timer({ seconds = 90, onTimeout, t }) {
  const [left, setLeft] = useState(seconds);

  // Зберігаємо останню версію onTimeout, щоб відлік не перезапускався при кожному кліку
  const onTimeoutRef = useRef(onTimeout);
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  // Щосекунди мінус 1; на нулі викликаємо onTimeout
  useEffect(() => {
    if (left <= 0) {
      onTimeoutRef.current?.();
      return;
    }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);

  // Зелений → жовтий → червоний, коли часу мало
  const color = left > 30 ? 'var(--ok)' : left > 10 ? 'var(--warning)' : 'var(--danger)';

  return (
    <div className="row" style={{ justifyContent: 'center' }} role="timer" aria-live="polite">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={R} style={{ fill: 'none', stroke: 'var(--space-dark)', strokeWidth: 6 }} />
        <circle
          cx="32"
          cy="32"
          r={R}
          transform="rotate(-90 32 32)"
          style={{
            fill: 'none',
            stroke: color,
            strokeWidth: 6,
            strokeLinecap: 'round',
            strokeDasharray: CIRCLE,
            strokeDashoffset: CIRCLE * (1 - left / seconds),
            transition: 'stroke-dashoffset 1s linear, stroke 0.3s',
          }}
        />
        <text x="32" y="38" textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 18, fontWeight: 700 }}>
          {left}
        </text>
      </svg>
      <span>{t('decision.timer_left', { n: left })}</span>
    </div>
  );
}