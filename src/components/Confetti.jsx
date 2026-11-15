// Маленьке святкування: зірочки й конфеті розлітаються й зникають (лише CSS).
// З prefers-reduced-motion не показується.
import '../styles/fx.css';

const PIECES = ['⭐', '✨', '🌟', '💫', '⭐', '✨', '🎉', '⭐', '✨', '🌟', '⭐', '💫', '✨', '⭐'];

export default function Confetti({ burst = 0 }) {
  return (
    <div className="confetti" key={burst} aria-hidden="true">
      {PIECES.map((p, i) => {
        const angle = (i / PIECES.length) * 360;
        const dist = 90 + (i % 4) * 28;
        return (
          <span
            key={i}
            className="confetti__piece"
            style={{
              '--dx': `${Math.round(Math.cos((angle * Math.PI) / 180) * dist)}px`,
              '--dy': `${Math.round(Math.sin((angle * Math.PI) / 180) * dist - 40)}px`,
              '--rot': `${(i % 2 ? 1 : -1) * (90 + i * 20)}deg`,
              animationDelay: `${(i % 3) * 40}ms`,
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
}
