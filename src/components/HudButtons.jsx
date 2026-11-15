// Маленькі кнопки-іконки панелі гри: 🔊 звук, ☀️/🌙 тема, ❓ як грати, 🗺️ зоряний шлях, 🏠 на старт.
// Тема перемикається одразу цією кнопкою (раніше «світла тема» відкривала налаштування).
import { ACTIONS } from '../game/contracts.js';

export default function HudButtons({ state, dispatch, t, help = true }) {
  const light = state.theme === 'light';
  return (
    <div className="hud-buttons" role="group" aria-label={t('briefing.hud.group')}>
      <button
        type="button"
        className="hud-btn"
        aria-pressed={!state.sound}
        aria-label={t(state.sound ? 'briefing.hud.sound_off' : 'briefing.hud.sound_on')}
        title={t(state.sound ? 'briefing.hud.sound_off' : 'briefing.hud.sound_on')}
        onClick={() => dispatch({ type: ACTIONS.TOGGLE_SOUND })}
      >
        <span aria-hidden="true">{state.sound ? '🔊' : '🔇'}</span>
      </button>
      <button
        type="button"
        className="hud-btn"
        aria-pressed={light}
        aria-label={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
        title={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
        data-tour="theme"
        onClick={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
      >
        <span aria-hidden="true">{light ? '🌙' : '☀️'}</span>
      </button>
      {help && (
        <button
          type="button"
          className="hud-btn"
          aria-label={t('briefing.hud.help')}
          title={t('briefing.hud.help')}
          onClick={() => dispatch({ type: ACTIONS.TUTORIAL_START })}
        >
          <span aria-hidden="true">❓</span>
        </button>
      )}
      <button
        type="button"
        className="hud-btn"
        aria-label={t('briefing.hud.map')}
        title={t('briefing.hud.map')}
        onClick={() => dispatch({ type: ACTIONS.GO, screen: 'map' })}
      >
        <span aria-hidden="true">🗺️</span>
      </button>
      <button
        type="button"
        className="hud-btn"
        aria-label={t('briefing.hud.home')}
        title={t('briefing.hud.home')}
        onClick={() => dispatch({ type: ACTIONS.GO, screen: 'start' })}
      >
        <span aria-hidden="true">🏠</span>
      </button>
    </div>
  );
}
