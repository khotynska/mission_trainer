// Мультяшна сцена бази на Місяці: купол, укриття, сонячна панель, екіпаж і космічна погода.
// Вона показує те, що раніше пояснювали довгі тексти: екіпаж спить / працює / в укритті,
// а спалах, хмара плазми чи радіаційна буря видно просто в небі.
// Кольори — токени --scene-* з theme.css.
import { useId } from 'react';
import '../styles/scene.css';

const STARS = [[8, 6], [22, 14], [35, 4], [50, 18], [63, 8], [78, 3], [92, 15], [104, 6], [118, 22], [12, 26], [70, 24], [150, 30], [146, 4], [30, 30], [86, 28]];
const SEP_STREAKS = [[150, -6], [128, -14], [110, -2], [140, 10], [96, -10], [120, 4], [84, -4], [104, 14], [70, -12], [60, 2], [134, -22], [46, -8]];

/** Маленький астронавт 5×8 «пікселів». */
function Astro({ x, y, flip }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
      {/* Анімація — на внутрішній групі: CSS transform інакше перезаписав би позицію */}
      <g className="scene__astro">
        <rect className="scene__suit" x={-2} y={0} width={4} height={3} />
        <rect className="scene__visor" x={-1} y={1} width={2} height={1} />
        <rect className="scene__suit" x={-2} y={3} width={4} height={3} />
        <rect className="scene__pack" x={-3} y={3} width={1} height={3} />
        <rect className="scene__suit" x={-2} y={6} width={1} height={2} />
        <rect className="scene__suit" x={1} y={6} width={1} height={2} />
      </g>
    </g>
  );
}

/**
 * @param {{
 *   phase: 'day'|'night', event: string,
 *   crew: 'sleep'|'work'|'shelter',
 *   effect: 'none'|'approach'|'strike',
 *   label: string, children?: React.ReactNode, tour?: string
 * }} props
 */
export default function BaseScene({ phase = 'day', event = 'QUIET', crew = 'work', effect = 'none', label, children, tour }) {
  const uid = useId().replace(/:/g, '');
  const sky = `sky-${uid}`;
  const kind = ['CME', 'EXTREME'].includes(event) ? 'cme' : event === 'SEP' ? 'sep' : ['M', 'X', 'X5'].includes(event) ? 'flare' : 'quiet';
  const big = ['X', 'X5', 'EXTREME', 'SEP'].includes(event);

  return (
    <figure
      className="scene"
      data-phase={phase}
      data-crew={crew}
      data-effect={effect}
      data-kind={kind}
      data-big={big || undefined}
      data-tour={tour}
    >
      <svg className="scene__art" viewBox="0 0 160 72" shapeRendering="crispEdges" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="scene__sky-top" />
            <stop offset="1" className="scene__sky-bottom" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="160" height="72" fill={`url(#${sky})`} />

        <g className="scene__stars">
          {STARS.map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" style={{ animationDelay: `${(i % 5) * 0.35}s` }} />)}
        </g>

        {/* Світило: Сонце вдень, Земля вночі */}
        {phase === 'night' ? (
          <g className="scene__earth">
            <circle cx="136" cy="14" r="7" className="scene__earth-sea" />
            <rect x="132" y="10" width="4" height="3" className="scene__earth-land" />
            <rect x="137" y="15" width="3" height="3" className="scene__earth-land" />
            <rect x="134" y="17" width="2" height="2" className="scene__earth-land" />
          </g>
        ) : (
          <g className="scene__sun">
            <circle cx="136" cy="14" r="12" className="scene__sun-glow" />
            <circle cx="136" cy="14" r="8" className="scene__sun-disc" />
            <circle cx="133" cy="11" r="3" className="scene__sun-core" />
          </g>
        )}

        {/* Спалах: промені від Сонця й спалах на все небо */}
        <g className="scene__flare">
          <rect x="120" y="13" width="7" height="2" /><rect x="145" y="13" width="7" height="2" />
          <rect x="135" y="0" width="2" height="4" /><rect x="135" y="24" width="2" height="6" />
          <rect x="124" y="3" width="3" height="3" /><rect x="145" y="23" width="3" height="3" />
          <rect x="145" y="3" width="3" height="3" /><rect x="124" y="23" width="3" height="3" />
        </g>
        <rect className="scene__flash" x="0" y="0" width="160" height="72" />

        {/* Хмара плазми (CME) летить від Сонця */}
        <g className="scene__cme">
          <circle cx="20" cy="22" r="12" /><circle cx="36" cy="16" r="14" /><circle cx="52" cy="24" r="11" />
          <circle cx="30" cy="30" r="10" /><circle cx="46" cy="34" r="8" />
        </g>

        {/* Радіаційна буря: швидкі частинки */}
        <g className="scene__sep">
          <g transform="rotate(35 100 20)">
            {SEP_STREAKS.map(([x, y], i) => (
              <rect key={i} x={x - 20} y={y - 30} width="1" height="6" style={{ animationDelay: `${(i % 6) * 0.12}s` }} />
            ))}
          </g>
        </g>

        {/* Ґрунт і кратери */}
        <path className="scene__ground-back" d="M0 50 L14 47 L30 49 L48 46 L70 48 L96 45 L120 48 L140 46 L160 48 L160 72 L0 72 Z" />
        <path className="scene__ground" d="M0 56 L20 54 L44 56 L70 54 L98 56 L126 54 L160 56 L160 72 L0 72 Z" />
        <ellipse className="scene__crater" cx="18" cy="63" rx="7" ry="2" />
        <ellipse className="scene__crater" cx="76" cy="66" rx="10" ry="2.5" />
        <ellipse className="scene__crater" cx="138" cy="62" rx="6" ry="1.6" />

        {/* Антена */}
        <rect className="scene__metal" x="12" y="40" width="1" height="15" />
        <path className="scene__metal" d="M8 38 L17 42 L16 43 L8 40 Z" />
        <rect className="scene__beacon" x="12" y="38" width="1" height="1" />

        {/* Житловий купол */}
        <path className="scene__dome" d="M22 56 Q22 36 40 36 Q58 36 58 56 Z" />
        <path className="scene__dome-shade" d="M44 37 Q58 39 58 56 L52 56 Q52 43 44 37 Z" />
        <circle className="scene__window" cx="34" cy="46" r="3" />
        <circle className="scene__window" cx="45" cy="46" r="3" />
        <rect className="scene__door" x="38" y="50" width="5" height="6" />
        <g className="scene__zzz">
          <text x="44" y="32">z</text><text x="48" y="27">z</text><text x="53" y="21">Z</text>
        </g>

        {/* Сонячна панель */}
        <rect className="scene__metal" x="72" y="42" width="2" height="14" />
        <path className="scene__panel" d="M62 34 L86 30 L86 39 L62 43 Z" />
        <path className="scene__panel-line" d="M70 33 L70 42 M78 31.5 L78 40.5 M62 38.5 L86 34.5" />

        {/* Укриття під шаром реголіту */}
        <ellipse className="scene__shield" cx="114" cy="54" rx="22" ry="15" />
        <path className="scene__bunker" d="M96 56 Q100 42 114 42 Q128 42 132 56 Z" />
        <path className="scene__bunker-rock" d="M100 48 L104 46 L106 48 Z M120 45 L124 44 L125 47 Z M126 51 L129 50 L130 53 Z" />
        <rect className="scene__bunker-door" x="110" y="48" width="8" height="8" />
        <path className="scene__bunker-sign" d="M112 44 L116 44 L116 46 L114 47.5 L112 46 Z" />

        {/* Ровер */}
        <rect className="scene__rover" x="140" y="51" width="12" height="3" />
        <rect className="scene__metal" x="143" y="48" width="1" height="3" />
        <circle className="scene__wheel" cx="142" cy="55" r="1.5" />
        <circle className="scene__wheel" cx="150" cy="55" r="1.5" />

        {/* Екіпаж надворі */}
        <g className="scene__crew">
          <Astro x={84} y={48} />
          <Astro x={92} y={49} flip />
        </g>
      </svg>
      {children}
    </figure>
  );
}

/** Годинник бази: час, перемотка ⏩ і шкала доби з позначкою події. */
export function MissionClock({ hour, eventHour, eventIcon, fast, label, fastLabel, tour }) {
  const h = Math.floor(hour) % 24;
  const m = Math.floor((hour % 1) * 60);
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return (
    <div className="clock" data-fast={fast || undefined} data-tour={tour} aria-label={`${label} ${time}`}>
      <span className="clock__time">
        <span aria-hidden="true">🕑</span> {time}
        {fast && <span className="clock__fast">{fastLabel}</span>}
      </span>
      <span className="clock__track" aria-hidden="true">
        <span className="clock__now" style={{ '--at': hour / 24 }} />
        <span className="clock__event" style={{ '--at': eventHour / 24 }}>{eventIcon}</span>
      </span>
    </div>
  );
}
