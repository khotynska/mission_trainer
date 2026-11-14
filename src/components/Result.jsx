// Власник: Dev 5. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Result({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  const r = state.result;
  if (!r) return null;
  return (
    <div className="screen">
      <h2>{t('result.title')}</h2>
      <p>{t(`result.${r.explanationKey}`, r.params)}</p>
      <ul>
        {Object.entries(r.deltas).map(([k, v]) => <li key={k}>{t(`common.${k}`)}: {v > 0 ? '+' : ''}{v}</li>)}
      </ul>
      <p><i>{t(`days.${state.briefing.textKey}.lesson`)}</i></p>
      <button onClick={() => dispatch({ type: 'NEXT' })}>{t('common.next')}</button>
    </div>
  );
}
