// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Certificate({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: ранг (getRank з gameEngine), гарний сертифікат
  return (
    <div className="screen">
      <h1>🏅 {t('progress.certificate')}</h1>
      <p>🔬 {state.science} · ☢️ {state.dose}</p>
    </div>
  );
}
