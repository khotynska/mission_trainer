// Власник: Dev 3. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Sources({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: DONKI (з ID подій), NASA Science (факти), фази Місяця, чесна примітка про умовні дози
  return (
    <div className="screen">
      <h2>{t('sources.title')}</h2>
      <button onClick={() => dispatch({ type: 'GO', screen: 'start' })}>←</button>
    </div>
  );
}
