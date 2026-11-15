// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// Стартовий екран у стилі MoonShift: великий піксельний логотип, піксельні Місяць, Земля й ракета,
// помічник у бульбашці. «Продовжити» веде на «Зоряний шлях» (мапу рівнів), «Нова місія» — одразу в день 1.
//
// Розкладка (ноутбук):            Телефон:
//   ┌─────────────────[UA][EN]┐     ┌──────[UA][EN]┐
//   │ ЛОГОТИП          │ Місяць│     │   Місяць     │
//   │ підзаголовок     │ Земля │     │ ЛОГОТИП      │
//   │ історія          │ ракета│     │ кнопки       │
//   │ [кнопки]  Ліра   │       │     │ Ліра         │
//   └──── дані NASA · приватність ┘   └──────────────┘
import { useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { saveLang } from '../game/storage';
import { LiraAvatar } from './Lira.jsx';
import { PixelEarth, PixelMoon, PixelRocket } from './PixelArt.jsx';
import '../styles/moonshift.css';

export default function Start({ state, dispatch, t }) {
    const [confirmNew, setConfirmNew] = useState(false);
    const inProgress = Boolean(state.resume);
    const finished = state.resume === 'certificate';
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
        <main className="ms" lang={lang}>
            <div className="ms-sky" aria-hidden="true"><i /><i /><i /></div>

            <div className="ms-menu">
                <div className="ms-menu__lang">
                    <span className="ms-seg" role="group" aria-label={t('progress.menu.language')}>
                        {['ua', 'en'].map((l) => (
                            <button
                                key={l}
                                type="button"
                                className="ms-btn"
                                aria-pressed={state.lang === l}
                                lang={l === 'en' ? 'en' : 'uk'}
                                onClick={() => setLang(l)}
                            >
                                {l === 'ua' ? 'УК' : 'EN'}
                            </button>
                        ))}
                    </span>
                </div>

                <section className="ms-menu__hero">
                    <h1><span className="ms-grad">{t('progress.menu.title')}</span></h1>
                    <p className="ms-menu__sub">{t('progress.menu.sub')}</p>
                    <p className="ms-menu__pitch">
                        {t('progress.menu.pitch_a')} <strong>{t('progress.menu.pitch_strong')}</strong> {t('progress.menu.pitch_b')}
                    </p>

                    <div className="ms-menu__actions">
                        {inProgress ? (
                            <>
                                <button type="button" className="ms-btn ms-btn--primary ms-btn--big" onClick={() => go('map')}>
                                    <span className="ms-emoji" aria-hidden="true">{finished ? '🗺️' : '▶'}</span>
                                    {finished ? t('progress.path.title') : t('progress.menu.continue', { n: state.day })}
                                </button>
                                <button type="button" className="ms-btn ms-btn--ghost" onClick={startNew}>
                                    <span className="ms-emoji" aria-hidden="true">🚀</span>
                                    {confirmNew ? t('progress.menu.confirmNew') : t('progress.menu.newMission')}
                                </button>
                            </>
                        ) : (
                            <button type="button" className="ms-btn ms-btn--primary ms-btn--big" onClick={startNew}>
                                <span className="ms-emoji" aria-hidden="true">🚀</span> {t('progress.menu.newMission')}
                            </button>
                        )}
                    </div>

                    <div className="ms-helper" data-mood={inProgress ? 'happy' : 'calm'}>
                        <div className="ms-helper__bot">
                            <LiraAvatar mood={inProgress ? 'happy' : 'neutral'} label={t('briefing.lira.avatar')} />
                        </div>
                        <p className="ms-bubble" aria-live="polite">
                            <span className="ms-bubble__who">{t('briefing.lira.name')}</span>
                            {helperText}
                        </p>
                    </div>
                </section>

                <div className="ms-menu__art" aria-hidden="true">
                    <div className="ms-menu__moon"><PixelMoon /></div>
                    <div className="ms-menu__earth"><PixelEarth /></div>
                    <div className="ms-menu__rocket"><PixelRocket /></div>
                </div>

                <footer className="ms-menu__foot">
                    <span>{t('progress.menu.footData')}</span>
                    <button type="button" className="ms-link" onClick={() => go('sources')}>
                        📡 {t('progress.start.sources')}
                    </button>
                    <span>{t('progress.menu.footPrivacy')}</span>
                </footer>
            </div>
        </main>
    );
}
