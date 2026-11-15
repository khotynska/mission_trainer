// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// «Зоряний шлях» у стилі всієї гри: ті самі панелі, шрифт, кнопки й плитки стану, що й у рівнях.
// Сама мапа — темний космос у рамці (як сцена бази): 30 піксельних зірок на звивистій стежці від старту до Землі,
// поділені на тижні. Пройдені — золоті з рейтингом ★1–3, поточна — блакитна з «▶ Грати», попереду — темні.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import { getPlayerName } from '../game/storage';
import days from '../data/days.json';
import Lira from './Lira.jsx';
import PatchBadge from './PatchBadge.jsx';
import StatTiles from './StatTiles.jsx';
import { PATCHES, PATCH_BY_WEEK } from './patches.js';
import { PixelEarth, PixelRocket, PixelStar, StarRating } from './PixelArt.jsx';
import '../styles/meters.css';
import '../styles/map.css';

const WEEKS = [
    { n: 1, from: 1, to: 7 },
    { n: 2, from: 8, to: 14 },
    { n: 3, from: 15, to: 21 },
    { n: 4, from: 22, to: 28 },
    { n: 5, from: 29, to: 30 },
];
const NODE_H = 112;
const NOW_H = 140;
const BANNER_H = 112;
const TOAST_MS = 2800;
/** Зірки дають дні 1–29 (день 30 — старт ракети). */
const MAX_STARS = 3 * (CONFIG.totalDays - 1);

export default function MissionMap({ state, dispatch, t }) {
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(0);
    const nowRef = useRef(null);
    const lang = state.lang === 'en' ? 'en-US' : 'uk-UA';
    const patches = state.patches || [];
    const light = state.theme === 'light';

    const started = Boolean(state.resume);
    const finished = state.resume === 'certificate';
    const current = started ? state.day : 1;
    const ratings = useMemo(() => Object.fromEntries((state.history || []).map((h) => [h.day, h.stars ?? 0])), [state.history]);
    const totalStars = Object.values(ratings).reduce((sum, n) => sum + n, 0);
    const cadet = getPlayerName() || t('progress.path.cadet');

    useEffect(() => {
        nowRef.current?.scrollIntoView({ block: 'center' });
        return () => clearTimeout(toastTimer.current);
    }, []);

    const say = (text) => {
        clearTimeout(toastTimer.current);
        setToast(text);
        toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
    };

    const dayState = (n) => {
        if (finished || n < current) return 'done';
        if (n === current) return 'now';
        return 'locked';
    };

    const openDay = (n) => {
        const st = dayState(n);
        if (st === 'now') {
            if (!started) dispatch({ type: ACTIONS.START_GAME });
            else dispatch({ type: ACTIONS.GO, screen: 'briefing' }); // рушій поверне туди, де гравець зупинився
            return;
        }
        if (st === 'done') {
            const stars = ratings[n] ?? 0;
            say(t('progress.path.doneToast', { n, stars: '★'.repeat(stars) + '☆'.repeat(3 - stars) }));
            return;
        }
        say(t('progress.path.lockedToast', { n: current }));
    };

    // Звивиста стежка: x у %, y у px
    const nodes = [];
    const pts = [];
    let y = 30;
    let i = 0;
    const place = (key, el, h = NODE_H) => {
        const x = 50 + 28 * Math.sin(i++ * 0.9);
        pts.push([x, y + 34]);
        nodes.push(el(key, x, y));
        y += h;
    };

    place('launch', (key, x, top) => (
        <button key={key} type="button" className="map-node map-node--end" data-state="done" style={{ left: `${x.toFixed(1)}%`, top }}
            onClick={() => say(t('progress.path.launchToast'))} aria-label={t('progress.path.launch')}>
            <span className="map-node__pic"><PixelRocket /></span>
            <span className="map-node__cap">{t('progress.path.launch')}</span>
        </button>
    ));

    for (const w of WEEKS) {
        const patch = PATCH_BY_WEEK[w.n];
        nodes.push(
            <div key={`week-${w.n}`} className="map-week" style={{ top: y }}>
                <span className="map-week__num">{w.n === 5 ? t('progress.path.finale') : t('progress.path.week', { n: w.n })}</span>
                <strong className="map-week__title">{t(`progress.path.weeks.${w.n}`)}</strong>
                <span className="map-week__goal">
                    {patch ? `🎯 ${t('progress.badge.how.' + patch)}` : t('progress.path.finaleGoal')}
                </span>
            </div>,
        );
        y += BANNER_H;

        for (let n = w.from; n <= w.to; n++) {
            const d = days[n - 1];
            const st = dayState(n);
            place(`d${n}`, (key, x, nodeTop) => (
                <button
                    key={key}
                    ref={st === 'now' ? nowRef : undefined}
                    type="button"
                    className="map-node"
                    data-state={st}
                    style={{ left: `${x.toFixed(1)}%`, top: nodeTop }}
                    aria-label={`${t('progress.path.dayAria', { n, date: d?.date ?? '' })}${st === 'locked' ? `, ${t('progress.path.locked')}` : ''}`}
                    onClick={() => openDay(n)}
                >
                    <span className="map-node__pic"><PixelStar state={st} /><b>{n}</b></span>
                    {d?.phase === 'night' && <span className="map-node__night" aria-hidden="true">🌙</span>}
                    {st === 'now' && <span className="map-node__go"><span aria-hidden="true">▶</span> {t('progress.path.play')}</span>}
                    {st === 'done' && ratings[n] !== undefined && (
                        <StarRating n={ratings[n]} label={t('progress.path.starsAria', { n: ratings[n], of: 3 })} />
                    )}
                </button>
            ), st === 'now' ? NOW_H : NODE_H);
        }
    }

    place('home', (key, x, top) => (
        <button key={key} type="button" className="map-node map-node--end" data-state={finished ? 'now' : 'locked'} style={{ left: `${x.toFixed(1)}%`, top }}
            onClick={() => (finished ? dispatch({ type: ACTIONS.GO, screen: 'certificate' }) : say(t('progress.path.homeToast')))}
            aria-label={t('progress.path.home')}>
            <span className="map-node__pic"><PixelEarth /></span>
            <span className="map-node__cap">{t('progress.path.home')}</span>
        </button>
    ));

    const H = y + 10;
    const line = pts.map(([x, py]) => `${x.toFixed(1)},${py}`).join(' ');
    const tip = current >= 22 && current <= 28 ? 'tipStorm' : current >= 15 && current < 29 ? 'tipNight' : 'tipStart';
    const earned = PATCHES.filter((p) => patches.includes(p.id));

    return (
        <main className="map" lang={lang}>
            <header className="meters map__bar">
                <div className="meters__header">
                    <h1 className="map__title">
                        <span aria-hidden="true">🗺️</span> {t('progress.path.title')}
                    </h1>
                    <div className="hud-buttons">
                        <button type="button" className="hud-btn map__sources" onClick={() => dispatch({ type: ACTIONS.GO, screen: 'sources' })}>
                            📡 <span className="map__sources-label">{t('progress.start.sources')}</span>
                        </button>
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
                        <button
                            type="button"
                            className="hud-btn"
                            aria-label={t('progress.path.mainMenu')}
                            title={t('progress.path.mainMenu')}
                            onClick={() => dispatch({ type: ACTIONS.GO, screen: 'start' })}
                        >
                            <span aria-hidden="true">🏠</span>
                        </button>
                    </div>
                </div>
            </header>

            <div className="map__layout">
                <section className="screen map__card" aria-label={t('progress.path.title')}>
                    <div className="map__space">
                        <div className="map__path" style={{ height: H }}>
                            <svg className="map__line" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
                                <polyline points={line} />
                            </svg>
                            {nodes}
                        </div>
                    </div>
                </section>

                <aside className="map__side">
                    <section className="screen map__panel">
                        <div className="map__cadet-row">
                            <strong className="map__cadet">👩‍🚀 {cadet}</strong>
                            <span className="chip map__stars">⭐ {totalStars} / {MAX_STARS}</span>
                        </div>
                        {/* Ті самі плитки, що й на панелі гри */}
                        <StatTiles state={state} t={t} layout="grid" />
                        <div className="map__badges-head">
                            <span>🏅 {t('progress.path.badges')}</span>
                            <strong>{earned.length} / {PATCHES.length}</strong>
                        </div>
                        <div className="map__badges">
                            {PATCHES.map((p) => (
                                <PatchBadge key={p.id} id={p.id} size={40} earned={patches.includes(p.id)} label={t('progress.patch.' + p.id)} />
                            ))}
                        </div>
                    </section>
                    <section className="screen map__panel">
                        <Lira mood="neutral" text={t(`progress.path.${tip}`)} t={t} compact />
                    </section>
                </aside>
            </div>
            {toast && <div className="map__toast" role="status">{toast}</div>}
        </main>
    );
}
