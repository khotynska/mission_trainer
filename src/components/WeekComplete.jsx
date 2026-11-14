// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function WeekComplete({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  const week = Math.ceil(state.day / 7);
  return (
    <div className="screen">
      <h2>{t('progress.week_complete', { n: week })}</h2>
      <p>{state.patches.join(', ')}</p>
      <button onClick={() => dispatch({ type: 'NEXT' })}>{t('common.next')}</button>
    </div>
  );
}
