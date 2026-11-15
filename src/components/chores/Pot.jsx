// 🍲 Приготувати обід: щоразу інша страва зі своїм набором продуктів.
// Перетягни (або торкнись) лише потрібні продукти — зайвий продукт каструля «виплюне».
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import DragItem from './DragItem.jsx';
import { isOver, useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const VARIANTS = [
  { key: 'soup', dish: '🍲', need: ['🥔', '🥕', '🧅', '🍅'], extra: '🍫' },
  { key: 'salad', dish: '🥗', need: ['🥬', '🍅', '🥒', '🫑'], extra: '🍬' },
  { key: 'omelette', dish: '🍳', need: ['🥚', '🧀', '🍅', '🧅'], extra: '🍌' },
  { key: 'pizza', dish: '🍕', need: ['🧀', '🍅', '🍄', '🫑'], extra: '🍓' },
  { key: 'porridge', dish: '🥣', need: ['🥛', '🍯', '🍓', '🍌'], extra: '🧄' },
  { key: 'pancakes', dish: '🥞', need: ['🥚', '🥛', '🍯', '🫐'], extra: '🧅' },
];
const SPOTS = [[12, 22], [34, 24], [12, 52], [34, 56], [12, 82], [34, 86]];

export default function Pot({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const items = [...v.need.map((e, i) => ({ id: `n${i}`, emoji: e, ok: true })), { id: 'x', emoji: v.extra, ok: false }];
  // зайвий продукт щоразу в іншому місці
  const order = items.map((_, i) => (i + variant) % items.length);
  const [inPot, setInPot] = useState([]);
  const inPotRef = useRef([]);
  const [splash, setSplash] = useState(0);
  const [spit, setSpit] = useState(0);
  const pot = useRef(null);
  const [done, finish] = useFinish(onDone);

  const add = (item) => {
    if (inPotRef.current.includes(item.id)) return;
    if (!item.ok) {
      play('bad');
      setSpit((n) => n + 1);
      return;
    }
    play('click');
    setSplash((n) => n + 1);
    const next = [...inPotRef.current, item.id];
    inPotRef.current = next;
    setInPot(next);
    if (next.length === v.need.length) finish();
  };

  return (
    <GameShell icon={v.dish} title={`${t(`levels.chore.cook.v.${v.key}`)} ${v.need.join('')}`} t={t} done={done}
      progress={inPot.length / v.need.length} label={t('decision.task_progress', { n: inPot.length, total: v.need.length })}>
      {items.filter((it) => !inPot.includes(it.id)).map((it) => {
        const [x, y] = SPOTS[order[items.indexOf(it)] % SPOTS.length];
        return (
          <DragItem key={it.id} emoji={it.emoji} label={it.emoji} x={x} y={y}
            onTap={() => add(it)}
            onRelease={(p) => { if (isOver(pot.current, p)) add(it); else play('tick'); }} />
        );
      })}
      <div ref={pot} className="mg-target mg-target--pot" data-shake={spit || undefined} key={`pot-${spit}`} aria-label={t('decision.mg.pot')}>
        <span key={splash} className="mg-target__icon">{done ? v.dish : '🍲'}</span>
        <span className="mg-target__steam" aria-hidden="true">{inPot.length > 0 ? '♨️' : ''}</span>
        <span className="mg-target__label">{spit ? t('decision.mg.not_this') : t('decision.mg.pot')}</span>
      </div>
    </GameShell>
  );
}
