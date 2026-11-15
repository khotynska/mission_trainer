// Космічне тло (як drawSpaceBackground у MoonShift): градієнт, зорі, за потреби — горизонт із ґрунтом і кратерами.
import { useMemo } from 'react';
import { C, H, W, mulberry32 } from './kit.js';

export default function SpaceBg({ seed = 1, horizonY = null, id = 'bg' }) {
  const { stars, craters } = useMemo(() => {
    const rnd = mulberry32(seed ^ 0x9e3779b9);
    const sky = horizonY ?? H;
    const s = Array.from({ length: 110 }, () => ({ x: rnd() * W, y: rnd() * sky, r: rnd() < 0.9 ? 1 : 1.8, a: 0.25 + rnd() * 0.6 }));
    const c = horizonY === null ? [] : Array.from({ length: 14 }, () => {
      const rr = 6 + rnd() * 26;
      return { x: rnd() * W, y: horizonY + 10 + rnd() * (H - horizonY - 20), rx: rr, ry: rr * 0.35 };
    });
    return { stars: s, craters: c };
  }, [seed, horizonY]);

  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={C.space0} />
          <stop offset="0.6" stopColor={C.space1} />
          <stop offset="1" stopColor={C.space2} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      {stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.a} />)}
      {horizonY !== null && (
        <>
          <rect y={horizonY} width={W} height={H - horizonY} fill={C.regolith} />
          {craters.map((c, i) => <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={C.regolithLight} opacity="0.35" />)}
        </>
      )}
    </g>
  );
}
