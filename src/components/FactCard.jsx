// Власник: Dev 5. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
import facts from '../data/facts.json';
export default function FactCard({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: вибір факту за днем, анімація картки
  const fact = facts[(state.day - 1) % facts.length];
  return (
    <div className="screen">
      <h2>{fact.emoji}</h2>
      <p>{t(`facts.${fact.id}`)}</p>
      <small>{fact.source}</small>
      <button onClick={() => dispatch({ type: 'NEXT' })}>{t('common.next')}</button>
    </div>
  );
}
