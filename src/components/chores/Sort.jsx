// 🧹 Прибрати станцію: розклади речі по двох кошиках. Щоразу інший набір (одяг, інструменти, кухня, лабораторія).
// Перетягни річ у потрібний кошик або торкнись речі, а потім кошика.
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import DragItem from './DragItem.jsx';
import { isOver, useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const VARIANTS = [
  {
    key: 'laundry',
    bins: [{ id: 'laundry', icon: '🧺' }, { id: 'trash', icon: '🗑️' }],
    items: [['🧦', 'laundry'], ['🥤', 'trash'], ['👕', 'laundry'], ['🍌', 'trash'], ['🧦', 'laundry']],
  },
  {
    key: 'tools',
    bins: [{ id: 'tools', icon: '🧰' }, { id: 'toys', icon: '📦' }],
    items: [['🔧', 'tools'], ['🧸', 'toys'], ['🔩', 'tools'], ['🎲', 'toys'], ['🪛', 'tools']],
  },
  {
    key: 'kitchen',
    bins: [{ id: 'sink', icon: '🚰' }, { id: 'recycle', icon: '♻️' }],
    items: [['🍽️', 'sink'], ['🥫', 'recycle'], ['🥄', 'sink'], ['📦', 'recycle'], ['🍴', 'sink']],
  },
  {
    key: 'lab',
    bins: [{ id: 'samples', icon: '🧪' }, { id: 'trash', icon: '🗑️' }],
    items: [['🪨', 'samples'], ['🧻', 'trash'], ['💎', 'samples'], ['🥤', 'trash'], ['🧊', 'samples']],
  },
];
const SPOTS = [[12, 20], [34, 34], [56, 18], [76, 34], [92, 16]];

export default function Sort({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const ITEMS = v.items.map(([emoji, bin], i) => ({ id: `i${i}`, emoji, bin, x: SPOTS[i][0], y: SPOTS[i][1] }));
  const BINS = v.bins;
  const [sorted, setSorted] = useState([]);
  const sortedRef = useRef([]);
  const [selected, setSelected] = useState(null);
  const [shake, setShake] = useState(null);
  const binA = useRef(null);
  const binB = useRef(null);
  const binRef = (id) => (id === BINS[0].id ? binA : binB);
  const [done, finish] = useFinish(onDone);

  const put = (itemId, binId) => {
    const item = ITEMS.find((i) => i.id === itemId);
    if (!item || sortedRef.current.includes(itemId)) return;
    if (item.bin !== binId) {
      play('bad');
      setShake(binId);
      return;
    }
    play('click');
    setSelected(null);
    const next = [...sortedRef.current, itemId];
    sortedRef.current = next;
    setSorted(next);
    if (next.length === ITEMS.length) finish();
  };

  return (
    <GameShell icon="🧹" title={t(`levels.chore.clean.v.${v.key}`)} t={t} done={done}
      progress={sorted.length / ITEMS.length} label={t('decision.task_progress', { n: sorted.length, total: ITEMS.length })}
      fieldProps={{ className: 'mg__field--sort' }}>
      {ITEMS.filter((i) => !sorted.includes(i.id)).map((i) => (
        <DragItem key={i.id} emoji={i.emoji} label={i.emoji} x={i.x} y={i.y} selected={selected === i.id}
          onTap={() => { play('click'); setSelected(selected === i.id ? null : i.id); }}
          onRelease={(p) => {
            const hit = BINS.find((b) => isOver(binRef(b.id).current, p));
            if (hit) put(i.id, hit.id);
            else play('tick');
          }} />
      ))}
      <div className="mg-bins">
        {BINS.map((b) => (
          <button key={b.id} ref={binRef(b.id)} type="button" className="mg-target mg-target--bin" data-sfx="none"
            data-shake={shake === b.id || undefined} data-ready={selected ? true : undefined}
            onAnimationEnd={() => setShake(null)} onClick={() => selected && put(selected, b.id)}>
            <span className="mg-target__icon" aria-hidden="true">{b.icon}</span>
            <span className="mg-target__label">{t(`decision.mg.bins.${b.id}`)}</span>
          </button>
        ))}
      </div>
    </GameShell>
  );
}
