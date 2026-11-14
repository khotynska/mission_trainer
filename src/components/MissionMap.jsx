// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function MissionMap({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: 30 днів, 4 тижні + відліт, день/ніч, нашивки
  return (
    <div className="screen">
      <h2>{t('common.map')}</h2>
      <p>Day {state.day} / 30 · patches: {state.patches.join(', ') || '—'}</p>
    </div>
  );
}
