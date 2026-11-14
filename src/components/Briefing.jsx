// Власник: Dev 5. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Briefing({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  const b = state.briefing;
  if (!b) return null;
  return (
    <div className="screen">
      <h2>{t('briefing.title')} · {t('common.day', { n: b.day })}</h2>
      <p>{t(`days.${b.textKey}.text`)}</p>
      {!b.comms && <p className="danger">{t('briefing.no_comms')}</p>}
      {b.warnings.map((w, i) => <p key={i} className="warning">{t('briefing.warning_cme', { n: w.inDays })}</p>)}
      <small>{t('briefing.real_event', { date: b.date })} · {b.event.donkiIds.join(', ')}</small>
      <button onClick={() => dispatch({ type: 'OPEN_DECISION' })}>{t('briefing.decide')}</button>
    </div>
  );
}
