import { PatchBadge, PATCHES } from './MissionMap';
import { saveLang } from '../game/storage';

// Розкладка (ноутбук):
//   ┌───────────────────────────────────┐
//   │                          [UA][EN] │
//   │  Заголовок + історія   │ планета  │
//   │  нашивки               │ кнопки   │
//   └──────── пейзаж внизу ─────────────┘
// Усе лежить у звичайному потоці, нічого не накладається одне на одне.
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.ja-start {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  min-height: 100svh;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Press Start 2P', monospace;
  color: #fff0d0;
  background: linear-gradient(180deg, #080b2c 0%, #101b55 38%, #174b91 72%, #bd493f 100%);
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
  position: relative; z-index: 2; width: 100%;
  display: grid;
  grid-template-columns: 1.25fr .75fr;
  grid-template-rows: auto 1fr;
  column-gap: 6%;
  align-items: center;
}

/* Мова: правий верхній кут */
.ja-lang { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 12px; }
.ja-lang button {
  font: inherit; font-size: 10px; min-width: 55px; min-height: 45px;
  background: rgba(7,10,34,.8); color: #fff0d0; border: 3px solid #79baff;
  cursor: pointer; box-shadow: 3px 3px 0 #07113a;
}
.ja-lang button[aria-pressed=true] { background: #79baff; color: #0a0f33; }

/* Ліва колонка: заголовок, підзаголовок, історія, нашивки */
.ja-content {
  grid-column: 1; grid-row: 2;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.ja-title {
  margin: 0 0 16px; font-size: clamp(30px, 4.2vw, 64px); line-height: 1.4; color: #ffd48b;
  letter-spacing: 2px;
  text-shadow: 3px 0 #e66a48, -3px 0 #e66a48, 0 3px #e66a48, 0 -3px #e66a48, 6px 6px 0 #6c253b;
}
.ja-sub { margin: 0 0 24px; font-size: clamp(11px, 1.2vw, 16px); color: #ff9870; line-height: 1.8; text-shadow: 2px 2px 0 #3a1408; }
.ja-story {
  width: 100%; max-width: 780px; box-sizing: border-box; margin: 0;
  font-size: clamp(10px, 1vw, 13px); line-height: 2.1; padding: 22px;
  background: rgba(5,10,42,.85); border: 3px solid #ff9d65; box-shadow: 5px 5px 0 #642a46;
}
.ja-bold { color: #ffb25e; }
.ja-patches-box { margin-top: 20px; font-size: 10px; }
.ja-patches { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 10px; }

/* Права колонка: планета зверху, під нею кнопки */
.ja-actions {
  grid-column: 2; grid-row: 2;
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
  width: 100%; font: inherit; font-size: clamp(10px, 1vw, 13px); min-height: 60px; padding: 14px 18px;
  cursor: pointer; color: #fff0d0; background: #101b55; border: 4px solid #ffad70;
  box-shadow: 5px 5px 0 #642a46; text-transform: uppercase; line-height: 1.8; text-align: center;
  transition: background .15s, transform .15s;
}
.ja-btn:hover, .ja-btn:focus-visible { background: #ffad70; color: #2a0e06; outline: none; }
.ja-btn:active { transform: translate(3px, 3px); box-shadow: 1px 1px 0 #3a1408; }
.ja-btn.main { background: #ffad70; color: #351323; border-color: #ffd48b; box-shadow: 5px 5px 0 #7d3039; }
.ja-btn.main:hover { background: #ffd48b; }
.ja-btn.alt { border-color: #79baff; box-shadow: 5px 5px 0 #07113a; }
.ja-btn.alt:hover { background: #79baff; color: #0a0f33; }

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
  .ja-start { width: 100%; margin-left: 0; padding: 16px 16px 24vh; }
  .ja-wrap { display: flex; flex-direction: column; align-items: center; gap: 20px; }
  .ja-lang { width: 100%; }
  .ja-title { font-size: clamp(22px, 8vw, 36px); }
  .ja-sub { font-size: 10px; margin-bottom: 14px; }
  .ja-story { font-size: 9px; line-height: 1.9; padding: 14px; }
  .ja-orbit { width: 100px; }
  .ja-actions { width: 100%; gap: 20px; }
  .ja-btn { min-height: 54px; font-size: 9px; }
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

    const setLang = (lang) => {
        saveLang(lang);
        dispatch({ type: 'SET_LANG', lang });
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
                        <button key={l} onClick={() => setLang(l)} aria-pressed={state.lang === l}>
                            {l.toUpperCase()}
                        </button>
                    ))}
                </div>

                <section className="ja-content">
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
                            <button
                                className="ja-btn main"
                                onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'briefing' })}
                            >
                                ▶ {t('progress.start.continue')} · {t('progress.map.day')} {state.day}
                            </button>
                        )}
                        <button
                            className={inProgress ? 'ja-btn' : 'ja-btn main'}
                            onClick={() => dispatch({ type: 'START_GAME' })}
                        >
                            🚀 {t('progress.start.begin')}
                        </button>
                        <button
                            className="ja-btn alt"
                            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'map', mapReturn: 'start' })}
                        >
                            🗺 {t('progress.start.map')}
                        </button>
                        <button
                            className="ja-btn alt"
                            onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'sources' })}
                        >
                            📡 {t('progress.start.sources')}
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}