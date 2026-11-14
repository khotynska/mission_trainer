// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
import { ACTIONS } from '../game/contracts.js';
import { saveLang } from '../game/storage';
import PatchBadge from './PatchBadge.jsx';
import { PATCHES } from './patches.js';

// Розкладка (ноутбук):
//   ┌───────────────────────────────────┐
//   │                          [UA][EN] │
//   │  Заголовок + історія   │ планета  │
//   │  нашивки               │ кнопки   │
//   └──────── пейзаж внизу ─────────────┘
// Усе лежить у звичайному потоці, нічого не накладається одне на одне.
// Кольори інтерфейсу — токени з theme.css (--px-*); літерали лишились лише в ілюстраціях
// (планета, зорі, пейзаж). Шрифти підключає theme.css.
const CSS = `
.ja-start {
  position: relative;
  box-sizing: border-box;
  /* На всю ширину вікна: компенсуємо бічний відступ оболонки .app (без 100vw → без горизонтального скролу) */
  margin-inline: calc(-1 * var(--app-gutter, 0px));
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  font-family: var(--font-pixel);
  color: var(--px-cream);
  background: var(--sky);
  image-rendering: pixelated;
  display: flex;
  /* знизу залишаємо місце під пейзаж, щоб він не перекривав кнопки */
  padding: 20px 6% 26vh;
}

/* Зоряне небо */
.ja-stars { position: absolute; inset: 0; pointer-events: none; }
.ja-stars i {
  position: absolute; width: 4px; height: 4px; background: #fff6c9;
  box-shadow: 0 0 8px #fff, 0 0 15px #ffbd70; animation: ja-tw 2s steps(2) infinite;
}
.ja-stars i.o { background: #ff8b55; box-shadow: 0 0 10px #ff713e; }
@keyframes ja-tw { 50% { opacity: .2; } }

/* Пейзаж */
.ja-land { position: absolute; left: 0; right: 0; bottom: 0; height: 28%; width: 100%; pointer-events: none; }

/* Сітка сторінки */
.ja-wrap {
  position: relative; z-index: 2; width: 100%; min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, .75fr);
  grid-template-rows: auto 1fr;
  column-gap: 6%;
  align-items: center;
}

/* Мова: правий верхній кут */
.ja-lang { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; }
.ja-lang button {
  font: inherit; font-size: 15px; min-width: 55px; min-height: 45px;
  background: rgba(7,10,34,.8); color: var(--px-cream); border: 3px solid var(--px-blue);
  cursor: pointer; box-shadow: 3px 3px 0 var(--px-blue-shadow);
}
.ja-lang button[aria-pressed=true] { background: var(--px-blue); color: var(--px-ink); }

/* Ліва колонка: заголовок, підзаголовок, історія, нашивки */
.ja-content {
  grid-column: 1; grid-row: 2; min-width: 0;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.ja-title {
  margin: 0 0 16px; font-size: clamp(30px, 4.2vw, 64px); line-height: 1.4; color: var(--px-gold);
  font-weight: 400; letter-spacing: 2px; overflow-wrap: break-word; max-width: 100%;
  text-shadow: 3px 0 var(--px-red), -3px 0 var(--px-red), 0 3px var(--px-red), 0 -3px var(--px-red), 6px 6px 0 var(--px-wine);
}
.ja-sub { margin: 0 0 24px; font-size: clamp(16px, 1.6vw, 22px); color: var(--px-coral); line-height: 1.4; text-shadow: 2px 2px 0 #3a1408; }
/* Історію читають діти 7–12: довгий текст — читабельним піксельним Tiny5, а не піксельним шрифтом заголовків */
.ja-story {
  width: 100%; max-width: 780px; box-sizing: border-box; margin: 0;
  font-family: var(--font); font-size: clamp(1.0625rem, 0.95rem + 0.4vw, 1.3125rem); line-height: 1.5; padding: 22px;
  background: rgba(5,10,42,.85); border: 3px solid var(--px-peach); box-shadow: 5px 5px 0 var(--px-wine);
  overflow-wrap: break-word; hyphens: auto;
}
.ja-bold { color: var(--px-orange); }
.ja-patches-box { margin-top: 20px; font-size: 15px; line-height: 1.4; }
.ja-patches { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }

/* Права колонка: планета зверху, під нею кнопки */
.ja-actions {
  grid-column: 2; grid-row: 2; min-width: 0;
  display: flex; flex-direction: column; align-items: center; gap: 28px;
}
.ja-orbit { position: relative; width: clamp(120px, 15vw, 220px); aspect-ratio: 1; flex: none; }
.ja-planet {
  width: 100%; height: 100%; border-radius: 50%;
  background: repeating-linear-gradient(170deg, #ffad70 0 12px, #f16b4d 12px 25px, #ffbd77 25px 36px, #c8443c 36px 50px);
  box-shadow: inset -20px -14px 0 rgba(55,10,30,.35), 0 0 0 4px #b43c39, 0 0 35px rgba(255,112,73,.3);
}
.ja-moon {
  position: absolute; left: -18%; bottom: 4%; width: 24%; aspect-ratio: 1; border-radius: 50%;
  background: #ffad69; box-shadow: inset -7px -5px 0 rgba(90,25,30,.4), 0 0 0 3px #a8443a;
}
.ja-btns { display: flex; flex-direction: column; gap: 16px; width: 100%; max-width: 440px; }
.ja-btn {
  width: 100%; font: inherit; font-size: clamp(15px, 1.4vw, 19px); min-height: 60px; padding: 14px 18px;
  cursor: pointer; color: var(--px-cream); background: var(--px-navy); border: 4px solid var(--px-orange);
  box-shadow: 5px 5px 0 var(--px-wine); text-transform: uppercase; line-height: 1.8; text-align: center;
  overflow-wrap: break-word; transition: background .15s, transform .15s;
}
.ja-btn:hover, .ja-btn:focus-visible { background: var(--px-orange); color: #2a0e06; outline: none; }
.ja-btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 #3a1408; }
.ja-btn.main { background: var(--px-orange); color: #351323; border-color: var(--px-gold); box-shadow: 5px 5px 0 var(--px-plum); }
.ja-btn.main:hover { background: var(--px-gold); }
.ja-btn.alt { border-color: var(--px-blue); box-shadow: 5px 5px 0 var(--px-blue-shadow); }
.ja-btn.alt:hover { background: var(--px-blue); color: var(--px-ink); }

/* Невисокі екрани ноутбуків */
@media (min-width: 701px) and (max-height: 750px) {
  .ja-start { padding-top: 14px; padding-bottom: 22vh; }
  .ja-title { font-size: clamp(26px, 3.4vw, 48px); margin-bottom: 10px; }
  .ja-sub { margin-bottom: 14px; }
  .ja-story { padding: 14px; }
  .ja-orbit { width: 110px; }
  .ja-actions { gap: 18px; }
  .ja-btn { min-height: 50px; }
  .ja-btns { gap: 12px; }
}

/* Телефон: одна колонка зверху вниз */
@media (max-width: 700px) {
  .ja-start { padding: 16px 16px 24vh; }
  .ja-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .ja-lang { width: 100%; }
  .ja-title { font-size: clamp(20px, 7.5vw, 36px); letter-spacing: 1px; }
  .ja-sub { font-size: 15px; margin-bottom: 14px; }
  .ja-story { font-size: 1.0625rem; padding: 14px; }
  .ja-orbit { width: 100px; }
  .ja-actions { width: 100%; gap: 20px; }
  .ja-btn { min-height: 54px; font-size: 14px; }
  .ja-land { height: 22%; }
}
`;

const STARS = [
    [6, 8, 0], [14, 22, 1], [22, 6, 0], [31, 30, 0], [40, 12, 1], [47, 4, 0], [55, 26, 0],
    [63, 9, 1], [71, 34, 0], [78, 16, 0], [86, 6, 1], [92, 28, 0], [10, 40, 0], [27, 46, 1],
    [58, 44, 0], [82, 48, 0], [18, 54, 0], [66, 52, 1], [38, 56, 0], [95, 42, 0],
];

export default function Start({ state, dispatch, t }) {
    const patches = state.patches || [];
    const inProgress = state.day > 1;
    const go = (screen) => dispatch({ type: ACTIONS.GO, screen });

    const setLang = (lang) => {
        saveLang(lang);
        dispatch({ type: ACTIONS.SET_LANG, lang });
    };

    return (
        <main className="ja-start">
            <style>{CSS}</style>

            <div className="ja-stars" aria-hidden="true">
                {STARS.map(([x, y, o], i) => (
                    <i
                        key={i}
                        className={o ? 'o' : ''}
                        style={{ left: x + '%', top: y + '%', animationDelay: (i % 5) * 0.4 + 's' }}
                    />
                ))}
            </div>

            <svg
                className="ja-land"
                viewBox="0 0 160 50"
                preserveAspectRatio="none"
                shapeRendering="crispEdges"
                aria-hidden="true"
            >
                <polygon fill="#7a2a24" points="0,50 0,30 10,30 10,24 18,24 18,18 28,18 28,24 36,24 36,30 52,30 52,36 70,36 70,30 80,30 80,22 90,22 90,14 100,14 100,22 110,22 110,30 126,30 126,24 136,24 136,30 160,30 160,50" />
                <polygon fill="#c4533a" points="0,50 0,38 20,38 20,34 40,34 40,40 64,40 64,36 96,36 96,42 120,42 120,36 146,36 146,40 160,40 160,50" />
                <polygon fill="#e0704a" points="0,50 0,44 30,44 30,42 60,42 60,46 100,46 100,44 130,44 130,47 160,47 160,50" />
            </svg>

            <div className="ja-wrap">
                <div className="ja-lang">
                    {['ua', 'en'].map((l) => (
                        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={state.lang === l}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>

                <section className="ja-content" lang={state.lang === 'en' ? 'en-US' : 'uk-UA'}>
                    <h1 className="ja-title">🌕 {t('progress.start.title')}</h1>
                    <p className="ja-sub">{t('progress.start.subtitle')}</p>

                    <p className="ja-story">
                        {t('progress.start.story')}
                        <br />
                        <span className="ja-bold">{t('progress.start.noSafe')}</span>
                    </p>

                    {patches.length > 0 && (
                        <div className="ja-patches-box">
                            <div>{t('progress.start.yourPatches')}</div>
                            <div className="ja-patches">
                                {PATCHES.filter((p) => patches.includes(p.id)).map((p) => (
                                    <PatchBadge key={p.id} id={p.id} label={t('progress.patch.' + p.id)} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                <section className="ja-actions">
                    <div className="ja-orbit" aria-hidden="true">
                        <div className="ja-planet" />
                        <div className="ja-moon" />
                    </div>

                    <div className="ja-btns">
                        {inProgress && (
                            <button type="button" className="ja-btn main" onClick={() => go('briefing')}>
                                ▶ {t('progress.start.continue')} · {t('progress.map.day')} {state.day}
                            </button>
                        )}
                        <button
                            type="button"
                            className={inProgress ? 'ja-btn' : 'ja-btn main'}
                            onClick={() => dispatch({ type: ACTIONS.START_GAME })}
                        >
                            🚀 {t('progress.start.begin')}
                        </button>
                        <button type="button" className="ja-btn alt" onClick={() => go('map')}>
                            🗺 {t('progress.start.map')}
                        </button>
                        <button type="button" className="ja-btn alt" onClick={() => go('sources')}>
                            📡 {t('progress.start.sources')}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}
