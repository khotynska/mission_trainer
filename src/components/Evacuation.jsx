// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Evacuation({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  return (
    <div className="screen">
      <p>{t('progress.evacuation')}</p>
      <button onClick={() => dispatch({ type: 'RESTART_WEEK' })}>{t('progress.restart_week')}</button>
    </div>
  );
}
