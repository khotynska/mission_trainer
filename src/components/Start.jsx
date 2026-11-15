// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// Стартовий екран у тому самому стилі, що й уся гра: панель .screen на піксельному небі з пейзажем,
// сцена бази на Місяці, Ліра в бульбашці, кнопки .btn. Мова (УК/EN) і тема (☀️/🌙) — угорі.
// І «Продовжити», і «Нова місія» відкривають «Зоряний шлях» (мапу рівнів).
import { useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { saveLang } from '../game/storage';
import BaseScene from './BaseScene.jsx';
import Lira from './Lira.jsx';
import { PixelRocket } from './PixelArt.jsx';
import '../styles/briefing.css';
import '../styles/start.css';

export default function Start({ state, dispatch, t }) {
    const [confirmNew, setConfirmNew] = useState(false);
    const inProgress = Boolean(state.resume);
    const finished = state.resume === 'certificate';
    const light = state.theme === 'light';
    const lang = state.lang === 'en' ? 'en-US' : 'uk-UA';
    const go = (screen) => dispatch({ type: ACTIONS.GO, screen });

    const setLang = (l) => {
        saveLang(l);
        dispatch({ type: ACTIONS.SET_LANG, lang: l });
    };

    // Нова місія поверх незавершеної — підтвердження другим натиском, щоб випадково не стерти прогрес.
    const startNew = () => {
        if (inProgress && !finished && !confirmNew) {
            setConfirmNew(true);
            return;
        }
        dispatch({ type: ACTIONS.START_GAME });
    };

    const helperText = inProgress
        ? t(finished ? 'progress.menu.finished' : 'progress.menu.welcomeBack', { n: state.day })
        : t('progress.menu.hello');

    return (
        <main className="start" lang={lang}>
            <div className="start__top">
                <span className="start__lang" role="group" aria-label={t('progress.menu.language')}>
                    {['ua', 'en'].map((l) => (
                        <button
                            key={l}
                            type="button"
                            className="hud-btn start__lang-btn"
                            aria-pressed={state.lang === l}
                            lang={l === 'en' ? 'en' : 'uk'}
                            onClick={() => setLang(l)}
                        >
                            {l === 'ua' ? 'УК' : 'EN'}
                        </button>
                    ))}
                </span>
                <button
                    type="button"
                    className="hud-btn"
                    aria-pressed={light}
                    aria-label={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
                    title={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
                    onClick={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
                >
                    <span aria-hidden="true">{light ? '🌙' : '☀️'}</span>
                </button>
            </div>

            <section className="screen start__card" aria-labelledby="start-title">
                <header className="start__head">
                    <h1 id="start-title" className="start__title">{t('progress.menu.title')}</h1>
                    <p className="start__sub">{t('progress.menu.sub')}</p>
                </header>

                <BaseScene phase="day" event="QUIET" crew="work" effect="none" label={t('briefing.scene.label', { state: t('briefing.scene.work') })}>
                    <span className="start__rocket" aria-hidden="true"><PixelRocket /></span>
                </BaseScene>

                <p className="start__pitch">
                    {t('progress.menu.pitch_a')} <strong>{t('progress.menu.pitch_strong')}</strong> {t('progress.menu.pitch_b')}
                </p>

                <Lira mood={inProgress ? 'happy' : 'neutral'} text={helperText} t={t} />

                <div className="screen__actions start__actions">
                    {inProgress ? (
                        <>
                            <button type="button" className="btn btn--secondary" onClick={startNew}>
                                <span aria-hidden="true">🚀</span> {confirmNew ? t('progress.menu.confirmNew') : t('progress.menu.newMission')}
                            </button>
                            <button type="button" className="btn btn--lg" onClick={() => go('map')}>
                                <span aria-hidden="true">{finished ? '🗺️' : '▶'}</span>
                                {finished ? t('progress.path.title') : t('progress.menu.continue', { n: state.day })}
                            </button>
                        </>
                    ) : (
                        <button type="button" className="btn btn--lg btn--block" onClick={startNew}>
                            <span aria-hidden="true">🚀</span> {t('progress.menu.newMission')}
                        </button>
                    )}
                </div>

                <footer className="source-note start__foot">
                    <span>🛰️ {t('progress.menu.footData')}</span>
                    <button type="button" className="start__link" onClick={() => go('sources')}>
                        📡 {t('progress.start.sources')}
                    </button>
                    <span>{t('progress.menu.footPrivacy')}</span>
                </footer>
            </section>
        </main>
    );
}
