// Власник: Dev 5. Пропси за контрактом: state, dispatch, t (див. src/game/contracts.js)
export default function Meters({ state, dispatch, t }) {  // eslint-disable-line no-unused-vars
  // TODO: шкали з анімацією
  return (
    <div className="meters">
      ⚡ {state.battery} · 🫁 {state.life} · ☢️ {state.dose} · 🔬 {state.science}
    </div>
  );
}
