// Власник: Dev 4. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
import { useState } from 'react';
export default function Decision({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: красивий розподіл жетонів, таймер 90 с, дитячий режим
  const [a, setA] = useState(state.lastAllocation);
  const tokens = state.briefing?.tokens ?? 0;
  const spent = a.life + a.shield + a.science;
  const change = (key, d) => {
    const v = a[key] + d;
    if (v < 0 || (key === 'shield' && v > 3) || spent + d > tokens) return;
    setA({ ...a, [key]: v });
  };
  return (
    <div className="screen">
      <h2>{t('decision.title')}</h2>
      {['life', 'shield', 'science'].map((k) => (
        <div key={k} className="row">
          <span>{t(`decision.${k}`)}</span>
          <button onClick={() => change(k, -1)}>−</button>
          <b>{a[k]}</b>
          <button onClick={() => change(k, 1)}>+</button>
        </div>
      ))}
      <p>{t('decision.tokens_left', { n: tokens - spent })}</p>
      <button onClick={() => dispatch({ type: 'SUBMIT_ALLOCATION', allocation: a })}>{t('decision.confirm')}</button>
    </div>
  );
}
