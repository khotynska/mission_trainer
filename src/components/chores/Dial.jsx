// 📞 Подзвонити родині: щоразу інша людина й інший номер — рік важливої космічної події.
import { useRef, useState } from 'react';
import GameShell from './GameShell.jsx';
import { useFinish } from './util.js';
import { pickVariant } from './variant.js';
import { play } from '../sfx.js';

const VARIANTS = [
  { key: 'mom', number: '1969' },
  { key: 'grandpa', number: '1990' },
  { key: 'sister', number: '2021' },
  { key: 'friend', number: '1998' },
  { key: 'dad', number: '2024' },
];
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export default function Dial({ t, variant = 0, onDone }) {
  const v = pickVariant(VARIANTS, variant);
  const NUMBER = v.number;
  const [typed, setTyped] = useState('');
  const typedRef = useRef('');
  const [wrong, setWrong] = useState(null);
  const [done, finish] = useFinish(onDone);

  const press = (k) => {
    if (done) return;
    if (k !== NUMBER[typedRef.current.length]) {
      play('bad');
      setWrong(k);
      return;
    }
    play('click');
    setWrong(null);
    const next = typedRef.current + k;
    typedRef.current = next;
    setTyped(next);
    if (next.length === NUMBER.length) finish();
  };

  return (
    <GameShell icon="📞" title={t(`levels.chore.call.v.${v.key}.title`)} t={t} done={done}
      progress={typed.length / NUMBER.length} label={t('decision.task_progress', { n: typed.length, total: NUMBER.length })}
      fieldProps={{ className: 'mg__field--phone' }}>
      <div className="mg-phone">
        <p className="mg-phone__hint">{t(`levels.chore.call.v.${v.key}.hint`, { number: NUMBER })}</p>
        <p className="mg-phone__screen" aria-live="polite">
          {NUMBER.split('').map((d, i) => <span key={i} data-on={i < typed.length || undefined}>{i < typed.length ? d : '•'}</span>)}
          {done && <span className="mg-phone__hearts" aria-hidden="true">💜💛💚</span>}
        </p>
        <div className="mg-phone__keys">
          {KEYS.map((k) => (
            <button key={k} type="button" className="mg-key" data-sfx="none" data-wrong={wrong === k || undefined}
              onClick={() => press(k)} onAnimationEnd={() => setWrong(null)}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </GameShell>
  );
}
