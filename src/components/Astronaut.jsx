// Астронавтка-інструкторка Нова: оригінальний піксельний аватар (сітка 24×24), махає рукою.
const Px = ({ x, y, w = 1, h = 1, className }) => <rect className={className} x={x} y={y} width={w} height={h} />;

export default function Astronaut({ label }) {
  return (
    <svg className="nova" viewBox="0 0 24 24" shapeRendering="crispEdges" role="img" aria-label={label}>
      {/* шолом */}
      <Px className="nova__suit" x={7} y={1} w={10} h={1} />
      <Px className="nova__suit" x={6} y={2} w={12} h={8} />
      <Px className="nova__shade" x={16} y={3} w={2} h={6} />
      <Px className="nova__visor" x={8} y={3} w={8} h={5} />
      <Px className="nova__shine" x={9} y={4} w={2} h={1} />
      <Px className="nova__shine" x={9} y={5} w={1} h={1} />
      <Px className="nova__suit" x={7} y={10} w={10} h={1} />
      {/* тулуб */}
      <Px className="nova__suit" x={6} y={11} w={12} h={7} />
      <Px className="nova__stripe" x={6} y={13} w={12} h={1} />
      <Px className="nova__shade" x={10} y={15} w={4} h={2} />
      <Px className="nova__stripe" x={11} y={15} w={2} h={1} />
      {/* рука, що махає */}
      <g className="nova__wave">
        <Px className="nova__suit" x={18} y={8} w={2} h={5} />
        <Px className="nova__suit" x={19} y={6} w={3} h={2} />
      </g>
      <Px className="nova__suit" x={3} y={12} w={3} h={5} />
      <Px className="nova__shade" x={3} y={16} w={3} h={1} />
      {/* ноги */}
      <Px className="nova__suit" x={7} y={18} w={4} h={4} />
      <Px className="nova__suit" x={13} y={18} w={4} h={4} />
      <Px className="nova__stripe" x={7} y={22} w={4} h={1} />
      <Px className="nova__stripe" x={13} y={22} w={4} h={1} />
    </svg>
  );
}
