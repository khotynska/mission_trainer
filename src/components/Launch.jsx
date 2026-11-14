// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js, розділ ВІДЛІТ)
export default function Launch({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: гарний екран старту ракети, пояснення ризику кожного варіанту
  return (
    <div className="screen">
      <h2>🚀 {t('progress.launch_title')}</h2>
      <button onClick={() => dispatch({ type: 'LAUNCH_CHOICE', choice: 'now' })}>{t('progress.launch_now')}</button>
      <button onClick={() => dispatch({ type: 'LAUNCH_CHOICE', choice: 'wait' })}>{t('progress.launch_wait')}</button>
    </div>
  );
}
