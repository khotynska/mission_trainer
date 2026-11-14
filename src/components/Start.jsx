// Власник: Dev 6. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Start({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  return (
    <div className="screen">
      <h1>🌕 {t('common.title')}</h1>
      <button onClick={() => dispatch({ type: 'START_GAME' })}>{t('common.start')}</button>
      <button onClick={() => dispatch({ type: 'GO', screen: 'sources' })}>{t('common.sources')}</button>
      <button onClick={() => dispatch({ type: 'SET_LANG', lang: state.lang === 'ua' ? 'en' : 'ua' })}>
        {state.lang === 'ua' ? 'EN' : 'UA'}
      </button>
    </div>
  );
}
