// Предмет, який можна перетягнути пальцем чи мишею (Pointer Events).
// Короткий дотик без руху або Enter/Space з клавіатури — це «торкання» (onTap).
import { useRef, useState } from 'react';
import { capture } from './util.js';

const TAP_PX = 8;

export default function DragItem({ emoji, label, x, y, selected, onRelease, onTap }) {
  const [offset, setOffset] = useState(null);
  const start = useRef(null);

  const down = (e) => {
    capture(e);
    start.current = { x: e.clientX, y: e.clientY };
    setOffset({ dx: 0, dy: 0 });
  };
  const move = (e) => {
    if (!start.current) return;
    setOffset({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y });
  };
  const up = (e) => {
    if (!start.current) return;
    const moved = Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y);
    start.current = null;
    setOffset(null);
    if (moved < TAP_PX) onTap?.();
    else onRelease?.({ x: e.clientX, y: e.clientY });
  };

  return (
    <button
      type="button"
      className="mg-drag"
      data-sfx="none"
      data-dragging={offset ? true : undefined}
      data-selected={selected || undefined}
      aria-label={label}
      aria-pressed={selected || undefined}
      style={{ left: `${x}%`, top: `${y}%`, transform: offset ? `translate(${offset.dx}px, ${offset.dy}px) scale(1.15)` : undefined }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => { start.current = null; setOffset(null); }}
      // Клавіатура: click без миші (detail === 0)
      onClick={(e) => { if (e.detail === 0) onTap?.(); }}
    >
      {emoji}
    </button>
  );
}
