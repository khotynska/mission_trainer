// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
// «Зоряний шлях» у стилі MoonShift: 30 днів — 30 піксельних зірок на звивистій стежці від старту до Землі,
// поділені на тижні. Пройдені — золоті з рейтингом ★1–3, поточна — блакитна з «▶ Грати», попереду — темні.
// Збоку — командир, стан бази (ті самі плитки, що й на панелі гри), значки й порада Ліри.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { CONFIG } from '../game/config.js';
import { getPlayerName } from '../game/storage';
import days from '../data/days.json';
import { LiraAvatar } from './Lira.jsx';
import PatchBadge from './PatchBadge.jsx';
import StatTiles from './StatTiles.jsx';
import { PATCHES, PATCH_BY_WEEK } from './patches.js';
import { MsLogo, PixelEarth, PixelRocket, PixelStar, StarRating } from './PixelArt.jsx';
import '../styles/meters.css';
import '../styles/moonshift.css';

const WEEKS = [
    { n: 1, from: 1, to: 7 },
    { n: 2, from: 8, to: 14 },
    { n: 3, from: 15, to: 21 },
    { n: 4, from: 22, to: 28 },
    { n: 5, from: 29, to: 30 },
];
const NODE_H = 112;
const NOW_H = 140;
const BANNER_H = 108;
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

    // Звивиста стежка: x у %, y у px (як мапа рівнів)
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
        <button key={key} type="button" className="ms-node ms-node--end" data-state="done" style={{ left: `${x.toFixed(1)}%`, top }}
            onClick={() => say(t('progress.path.launchToast'))} aria-label={t('progress.path.launch')}>
            <span className="ms-node__pic"><PixelRocket /></span>
            <span className="ms-node__cap">{t('progress.path.launch')}</span>
        </button>
    ));

    for (const w of WEEKS) {
        const patch = PATCH_BY_WEEK[w.n];
        nodes.push(
            <div key={`week-${w.n}`} className="ms-banner" style={{ top: y }}>
                <span className="ms-banner__num">{w.n === 5 ? t('progress.path.finale') : t('progress.path.week', { n: w.n })}</span>
                <strong>{t(`progress.path.weeks.${w.n}`)}</strong>
                <span className="ms-banner__goal">
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
                    className="ms-node"
                    data-state={st}
                    style={{ left: `${x.toFixed(1)}%`, top: nodeTop }}
                    aria-label={`${t('progress.path.dayAria', { n, date: d?.date ?? '' })}${st === 'locked' ? `, ${t('progress.path.locked')}` : ''}`}
                    onClick={() => openDay(n)}
                >
                    <span className="ms-node__pic"><PixelStar state={st} /><b>{n}</b></span>
                    {d?.phase === 'night' && <span className="ms-node__night" aria-hidden="true">🌙</span>}
                    {st === 'now' && <span className="ms-go"><span aria-hidden="true">▶</span> {t('progress.path.play')}</span>}
                    {st === 'done' && ratings[n] !== undefined && (
                        <StarRating n={ratings[n]} label={t('progress.path.starsAria', { n: ratings[n], of: 3 })} />
                    )}
                </button>
            ), st === 'now' ? NOW_H : NODE_H);
        }
    }

    place('home', (key, x, top) => (
        <button key={key} type="button" className="ms-node ms-node--end" data-state={finished ? 'now' : 'locked'} style={{ left: `${x.toFixed(1)}%`, top }}
            onClick={() => (finished ? dispatch({ type: ACTIONS.GO, screen: 'certificate' }) : say(t('progress.path.homeToast')))}
            aria-label={t('progress.path.home')}>
            <span className="ms-node__pic"><PixelEarth /></span>
            <span className="ms-node__cap">{t('progress.path.home')}</span>
        </button>
    ));

    const H = y + 10;
    const line = pts.map(([x, py]) => `${x.toFixed(1)},${py}`).join(' ');
    const tip = current >= 22 && current <= 28 ? 'tipStorm' : current >= 15 && current < 29 ? 'tipNight' : 'tipStart';
    const earned = PATCHES.filter((p) => patches.includes(p.id));

    return (
        <main className="ms" lang={lang}>
            <div className="ms-sky" aria-hidden="true"><i /><i /><i /></div>
            <div className="ms-screen">
                <header className="ms-topbar">
                    <button type="button" className="ms-logo" onClick={() => dispatch({ type: ACTIONS.GO, screen: 'start' })} aria-label={t('progress.path.mainMenu')}>
                        <MsLogo /> {t('progress.menu.title')}
                    </button>
                    <span className="ms-crumb">/ {t('progress.path.title')}</span>
                    <span className="ms-spacer" />
                    <button type="button" className="ms-btn ms-btn--ghost" onClick={() => dispatch({ type: ACTIONS.GO, screen: 'sources' })}>
                        <span className="ms-emoji" aria-hidden="true">📡</span> {t('progress.start.sources')}
                    </button>
                    <button
                        type="button"
                        className="ms-btn ms-btn--icon"
                        aria-pressed={light}
                        aria-label={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
                        title={t(light ? 'briefing.hud.theme_dark' : 'briefing.hud.theme_light')}
                        onClick={() => dispatch({ type: ACTIONS.TOGGLE_THEME })}
                    >
                        <span className="ms-emoji" aria-hidden="true">{light ? '🌙' : '☀️'}</span>
                    </button>
                </header>

                <div className="ms-map">
                    <div className="ms-path" style={{ height: H }}>
                        <svg className="ms-path__line" viewBox={`0 0 100 ${H}`} preserveAspectRatio="none" aria-hidden="true">
                            <polyline points={line} />
                        </svg>
                        {nodes}
                    </div>

                    <aside className="ms-stack ms-map__side">
                        <section className="ms-panel ms-stack">
                            <div className="ms-row">
                                <strong className="ms-cadet">{cadet}</strong>
                                <span className="ms-spacer" />
                                <span className="ms-chip">⭐ {totalStars} / {MAX_STARS}</span>
                            </div>
                            {/* Ті самі плитки, що й на панелі гри */}
                            <StatTiles state={state} t={t} layout="grid" />
                            <div className="ms-stack" style={{ gap: 8 }}>
                                <div className="ms-row">
                                    <span>🏅 {t('progress.path.badges')}</span>
                                    <span className="ms-spacer" />
                                    <strong>{earned.length} / {PATCHES.length}</strong>
                                </div>
                                <div className="ms-badges">
                                    {PATCHES.map((p) => (
                                        <PatchBadge key={p.id} id={p.id} size={40} earned={patches.includes(p.id)} label={t('progress.patch.' + p.id)} />
                                    ))}
                                </div>
                            </div>
                        </section>
                        <section className="ms-panel ms-panel--tight">
                            <div className="ms-helper ms-helper--small">
                                <div className="ms-helper__bot"><LiraAvatar mood="neutral" label={t('briefing.lira.avatar')} /></div>
                                <p className="ms-bubble">
                                    <span className="ms-bubble__who">{t('briefing.lira.name')}</span>
                                    {t(`progress.path.${tip}`)}
                                </p>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
            {toast && <div className="ms-toast" role="status">{toast}</div>}
        </main>
    );
}
