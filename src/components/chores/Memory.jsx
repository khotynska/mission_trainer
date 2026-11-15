// 🎲 Вечір настільних ігор: знайди пари однакових карток.
import { useEffect, useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

// Набори карток і розкладки — щоразу інші (без випадковості в рендері).
const VARIANTS = [
  { key: 'games', set: ['🎲', '🃏', '♟️'] },
  { key: 'space', set: ['🚀', '🌕', '⭐'] },
  { key: 'aliens', set: ['👽', '🛸', '🪐'] },
  { key: 'animals', set: ['🦖', '🐙', '🦄'] },
];
const LAYOUTS = [[0, 1, 2, 1, 2, 0], [2, 0, 1, 1, 0, 2], [1, 2, 0, 2, 1, 0], [0, 2, 1, 0, 2, 1]];
const FLIP_BACK_MS = 700;

export default function Memory({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const CARDS = pickVariant(LAYOUTS, variant).map((i) => v.set[i]);
  const [open, setOpen] = useState([]);
  const [matched, setMatched] = useState([]);
  // Актуальні значення для швидких дотиків поспіль (до наступного рендера)
  const openRef = useRef([]);
  const matchedRef = useRef([]);
  const timer = useRef(0);
  const [done, finish] = useFinish(onDone);
  useEffect(() => () => clearTimeout(timer.current), []);

  const setOpenBoth = (v) => {
    openRef.current = v;
    setOpen(v);
  };

  const flip = (i) => {
    const cur = openRef.current;
    if (cur.length === 2 || cur.includes(i) || matchedRef.current.includes(i)) return;
    play('click');
    const next = [...cur, i];
    setOpenBoth(next);
    if (next.length < 2) return;
    const [a, b] = next;
    if (CARDS[a] === CARDS[b]) {
      play('select');
      const m = [...matchedRef.current, a, b];
      matchedRef.current = m;
      setMatched(m);
      setOpenBoth([]);
      if (m.length === CARDS.length) finish();
    } else {
      timer.current = setTimeout(() => setOpenBoth([]), FLIP_BACK_MS);
    }
  };

  const pairs = matched.length / 2;
  return (
    <GameShell icon={v.set[0]} title={t(`levels.chore.games.v.${v.key}`)} t={t} done={done}
      progress={pairs / (CARDS.length / 2)} label={t('decision.task_progress', { n: pairs, total: CARDS.length / 2 })}
      fieldProps={{ className: 'mg__field--cards' }}>
      <div className="mg-cards">
        {CARDS.map((c, i) => {
          const shown = open.includes(i) || matched.includes(i);
          return (
            <button key={i} type="button" className="mg-card" data-sfx="none" data-open={shown || undefined} data-matched={matched.includes(i) || undefined}
              aria-label={shown ? c : `${t('decision.mg.card')} ${i + 1}`} onClick={() => flip(i)}>
              <span aria-hidden="true">{shown ? c : '❓'}</span>
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
