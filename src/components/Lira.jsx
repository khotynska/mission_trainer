// Робот Ліра з ЦУП: піксельний аватар із настроєм + маленька репліка-бульбашка.
// Ліра пояснює подію саме тоді, коли це важливо (а не великим текстом перед днем).
// Використовують Briefing, Decision, Result, CalmSummary, Launch, Evacuation.
import '../styles/lira.css';

/** Піксельний прямокутник у сітці 24×24. */
const Px = ({ x, y, w = 1, h = 1, className }) => <rect className={className} x={x} y={y} width={w} height={h} />;

/** Обличчя на візорі для кожного настрою. */
function Face({ mood }) {
  if (mood === 'offline') {
    return (
      <g className="lira-avatar__face">
        <Px x={8} y={10} w={2} /><Px x={14} y={10} w={2} /><Px x={10} y={12} w={4} />
      </g>
    );
  }
  if (mood === 'happy') {
    return (
      <g className="lira-avatar__face">
        <Px x={8} y={10} /><Px x={9} y={9} /><Px x={10} y={10} />
        <Px x={13} y={10} /><Px x={14} y={9} /><Px x={15} y={10} />
        <Px x={9} y={11} /><Px x={14} y={11} /><Px x={10} y={12} w={4} />
      </g>
    );
  }
  if (mood === 'worried') {
    return (
      <>
        <g className="lira-avatar__face">
          <Px x={8} y={9} /><Px x={9} y={8} /><Px x={14} y={8} /><Px x={15} y={9} />
          <Px x={10} y={11} w={4} /><Px x={9} y={12} /><Px x={14} y={12} />
        </g>
        <Px className="lira-avatar__eye" x={8} y={10} w={2} h={1} />
        <Px className="lira-avatar__eye" x={14} y={10} w={2} h={1} />
      </>
    );
  }
  if (mood === 'alert') {
    return (
      <>
        <Px className="lira-avatar__eye" x={8} y={9} w={2} h={2} />
        <Px className="lira-avatar__eye" x={14} y={9} w={2} h={2} />
        <g className="lira-avatar__face"><Px x={11} y={11} w={2} h={2} /></g>
      </>
    );
  }
  return (
    <>
      <Px className="lira-avatar__eye" x={8} y={9} w={2} h={2} />
      <Px className="lira-avatar__eye" x={14} y={9} w={2} h={2} />
      <g className="lira-avatar__face">
        <Px x={9} y={11} /><Px x={14} y={11} /><Px x={10} y={12} w={4} />
      </g>
    </>
  );
}

/** @param {{ mood?: 'neutral'|'happy'|'worried'|'alert'|'offline', label: string }} props */
export function LiraAvatar({ mood = 'neutral', label }) {
  const offline = mood === 'offline';
  return (
    <svg className="lira-avatar" data-mood={mood} viewBox="0 0 24 24" shapeRendering="crispEdges" role="img" aria-label={label}>
      {offline ? (
        <g className="lira-avatar__offline">
          <Px x={17} y={0} /><Px x={19} y={0} /><Px x={18} y={1} /><Px x={17} y={2} /><Px x={19} y={2} />
        </g>
      ) : (
        <g className="lira-avatar__signal">
          <Px x={7} y={0} /><Px x={6} y={1} h={2} /><Px x={7} y={3} />
          <Px x={16} y={0} /><Px x={17} y={1} h={2} /><Px x={16} y={3} />
        </g>
      )}
      <Px className="lira-avatar__beacon" x={10} y={0} w={4} h={3} />
      <Px className="lira-avatar__antenna" x={11} y={3} w={2} h={3} />
      <Px className="lira-avatar__ear" x={2} y={9} w={2} h={5} />
      <Px className="lira-avatar__ear" x={20} y={9} w={2} h={5} />
      <Px className="lira-avatar__shell" x={5} y={6} w={14} h={11} />
      <Px className="lira-avatar__shell" x={4} y={7} w={16} h={9} />
      <Px className="lira-avatar__shine" x={6} y={7} w={2} h={1} />
      <Px className="lira-avatar__visor" x={7} y={8} w={10} h={6} />
      <Px className="lira-avatar__visor" x={6} y={9} w={12} h={4} />
      <Face mood={mood} />
      <Px className="lira-avatar__shade" x={10} y={17} w={4} h={2} />
      <Px className="lira-avatar__shell" x={6} y={19} w={12} h={5} />
      <Px className="lira-avatar__shell" x={5} y={20} w={14} h={4} />
      <Px className="lira-avatar__core" x={11} y={21} w={2} h={2} />
    </svg>
  );
}

/**
 * Ліра + бульбашка з однією реплікою.
 * @param {{ mood?: string, text: string, t: Function, children?: React.ReactNode, compact?: boolean, tour?: string }} props
 */
export default function Lira({ mood = 'neutral', text, t, children, compact = false, tour }) {
  const label = t(mood === 'offline' ? 'briefing.lira.avatar_offline' : 'briefing.lira.avatar');
  return (
    <div className="lira" data-mood={mood} data-compact={compact || undefined} data-tour={tour}>
      <LiraAvatar mood={mood} label={label} />
      <div className="lira__bubble" key={text} role="status" aria-live="polite">
        <p className="lira__name">{t('briefing.lira.name')}</p>
        <p className="lira__text">{text}</p>
        {children}
      </div>
    </div>
  );
}
