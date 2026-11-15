// 🍅 Зібрати урожай: торкнись усього, що достигло. Щоразу інший урожай (овочі, ягоди, салат, коренеплоди, фрукти).
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const SPOTS = [[14, 30], [42, 64], [70, 26], [28, 76], [84, 66], [56, 40], [86, 20]];
const VARIANTS = [
  { key: 'veg', crop: ['🍅', '🥒', '🍅', '🥔', '🍅'] },
  { key: 'berries', crop: ['🍓', '🫐', '🍓', '🫐', '🍓'] },
  { key: 'salad', crop: ['🥬', '🥕', '🥬', '🫑', '🥕'] },
  { key: 'roots', crop: ['🥔', '🧅', '🥔', '🧄', '🥔'] },
  { key: 'fruit', crop: ['🍎', '🍐', '🍋', '🍎', '🍐'] },
];

export default function Harvest({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const shift = variant % SPOTS.length; // і місця щоразу інші
  const [picked, setPicked] = useState([]);
  const pickedRef = useRef([]);
  const [done, finish] = useFinish(onDone);

  const pick = (i) => {
    if (pickedRef.current.includes(i)) return;
    play('click');
    const next = [...pickedRef.current, i];
    pickedRef.current = next;
    setPicked(next);
    if (next.length === v.crop.length) finish();
  };

  return (
    <GameShell icon={v.crop[0]} title={t(`levels.chore.harvest.v.${v.key}`)} t={t} done={done}
      progress={picked.length / v.crop.length} label={t('decision.task_progress', { n: picked.length, total: v.crop.length })}
      fieldProps={{ className: 'mg__field--greenhouse' }}>
      {v.crop.map((emoji, i) => {
        const [x, y] = SPOTS[(i + shift) % SPOTS.length];
        return (
          <button key={i} type="button" className="mg-tap" data-sfx="none" data-gone={picked.includes(i) || undefined}
            disabled={picked.includes(i)} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.15}s` }}
            aria-label={`${emoji} ${i + 1}`} onClick={() => pick(i)}>
            {emoji}
          </button>
        );
      })}
    </GameShell>
  );
}
