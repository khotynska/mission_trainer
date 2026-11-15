// Піксельні спрайти зі стилю MoonShift: зірка рівня, ракета, Земля, Місяць і логотип.
// Спрайт — це текстова сітка: один символ = один піксель, '.' = порожньо. Без файлів-картинок, чіткі в будь-якому розмірі.
// Кольори спрайтів — частина ілюстрації (як і на стартовому екрані), тому літерали тут дозволені.

/** Сітка → SVG-прямокутники (сусідні пікселі одного кольору зливаються в один прямокутник). */
function Sprite({ rows, pal, className = 'ms-sprite' }) {
  const rects = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length;) {
      let w = 1;
      while (row[x + w] === row[x]) w++;
      if (pal[row[x]]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={w} height={1} fill={pal[row[x]]} />);
      x += w;
    }
  });
  return (
    <svg className={className} viewBox={`0 0 ${rows[0].length} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true">
      {rects}
    </svg>
  );
}

const STAR = ['.....o.....', '....oYo....', '....oYo....', 'oooooYooooo', '.oYYYYYYYo.', '..oYYYYYo..', '...oYYYo...', '..oYYoYYo..', '..oYo.oYo..', '.oYo...oYo.', '.oo.....oo.'];
const STAR_PAL = {
  done: { o: '#c98a1a', Y: '#ffd36b' },
  now: { o: '#e9fbff', Y: '#4de1ff' },
  locked: { o: '#4a5288', Y: '#232a52' },
};

const ROCKET = ['....r....', '...rwr...', '...www...', '..wwwww..', '..wwbww..', '..wbbbw..', '..wwbww..', '..wwwww..', '.rwwwwwr.', 'rrwwwwwrr', 'r..www..r', '...f.f...', '..fYfYf..', '...Y.Y...'];
const ROCKET_PAL = { r: '#ff5577', w: '#eef2ff', b: '#4de1ff', f: '#ffb547', Y: '#ffe08a' };

/** Кругла піксельна планета, освітлена зліва: денний бік, темніша нічна частина, плями, обідок. */
function planetRows(n, spots, terminator) {
  const c = (n - 1) / 2;
  const R = n / 2;
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (__, x) => {
    const d = Math.hypot(x - c, y - c);
    if (d > R - 0.35) return '.';
    const spot = spots.some(([sx, sy, r]) => Math.hypot(x - sx, y - sy) <= r);
    const night = (x - c) / R > terminator;
    if (d > R - 1.35) return night ? 'E' : 'e';
    if (night) return spot ? 'S' : 'n';
    return spot ? 's' : 'm';
  }).join(''));
}
const MOON = planetRows(32, [[9, 10, 3], [20, 7, 2], [13, 20, 4], [23, 19, 2.5], [7, 23, 1.8], [17, 13, 1.5], [25, 11, 1.5]], 0.4);
const EARTH = planetRows(16, [[5, 5, 2.5], [4, 7, 2], [10, 9, 2.5], [11, 12, 1.5], [7, 12, 1]], 0.3);
const MOON_PAL = { m: '#d4d6ea', s: '#a7aac6', n: '#5d6185', S: '#474b6e', e: '#eef0ff', E: '#3b3f63' };
const EARTH_PAL = { m: '#2a6fe0', s: '#3fbf7f', n: '#173f8f', S: '#24734f', e: '#9fdcff', E: '#2a4f9f' };

/** @param {{ state: 'done' | 'now' | 'locked' }} props */
export function PixelStar({ state = 'locked' }) {
  return <Sprite rows={STAR} pal={STAR_PAL[state] ?? STAR_PAL.locked} className={`ms-sprite ms-star-${state}`} />;
}

export function PixelRocket() {
  return <Sprite rows={ROCKET} pal={ROCKET_PAL} />;
}

export function PixelEarth() {
  return <Sprite rows={EARTH} pal={EARTH_PAL} />;
}

export function PixelMoon() {
  return <Sprite rows={MOON} pal={MOON_PAL} />;
}

/** Рейтинг дня: N з 3 піксельних зірочок. */
export function StarRating({ n, of = 3, label }) {
  return (
    <span className="ms-stars" role="img" aria-label={label}>
      {Array.from({ length: of }, (_, i) => <PixelStar key={i} state={i < n ? 'done' : 'locked'} />)}
    </span>
  );
}

/** Логотип: Місяць на орбіті. */
export function MsLogo() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id="ms-logo-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#4de1ff" />
          <stop offset="1" stopColor="#c26bff" />
        </linearGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="18" ry="7" fill="none" stroke="url(#ms-logo-grad)" strokeWidth="2" transform="rotate(-20 20 20)" />
      <circle cx="20" cy="20" r="10" fill="#d9dcef" />
      <path d="M20 10a10 10 0 0 1 0 20 7 10 0 0 0 0-20Z" fill="#7b7f9c" />
      <circle cx="16" cy="17" r="2" fill="#b9bdd6" />
      <circle cx="22" cy="24" r="1.4" fill="#b9bdd6" />
    </svg>
  );
}
