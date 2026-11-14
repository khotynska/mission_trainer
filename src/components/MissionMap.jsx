import { useEffect } from 'react';
import { getLang } from '../game/storage';

// Нашивки: 4 значки (emoji в колі). Ключі збігаються зі state.patches.
export const PATCHES = [
    { id: 'energy', icon: '⚡', week: 1 },
    { id: 'science', icon: '🔬', week: 2 },
    { id: 'night', icon: '🌙', week: 3 },
    { id: 'shield', icon: '🛡️', week: 4 },
];

export function PatchBadge({ id, earned = true, size = 48, label }) {
    const p = PATCHES.find((x) => x.id === id);
    return (
        <span
            title={label}
            aria-label={label}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: size,
                height: size,
                borderRadius: '50%',
                fontSize: size * 0.5,
                border: '2px solid var(--accent, #ffcc4d)',
                background: earned ? 'var(--card, #161d3d)' : 'transparent',
                opacity: earned ? 1 : 0.3,
                filter: earned ? 'none' : 'grayscale(1)',
            }}
        >
      {p ? p.icon : '?'}
    </span>
    );
}

// Мова для дат: state.lang, а якщо його немає, береться зі збереженого.
function dateFor(dayNumber, lang) {
    const d = new Date(Date.UTC(2024, 3, 17 + dayNumber - 1));
    return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'uk-UA', {
        day: 'numeric',
        month: 'short',
        timeZone: 'UTC',
    });
}

function phaseIcon(day) {
    if (day >= 29) return '🌅';
    return day >= 15 ? '🌑' : '☀️';
}

const WEEKS = [
    { n: 1, from: 1, to: 7 },
    { n: 2, from: 8, to: 14 },
    { n: 3, from: 15, to: 21 },
    { n: 4, from: 22, to: 28 },
    { n: 5, from: 29, to: 30 },
];

// Мапа лише для перегляду: перестрибувати дні не можна.
export default function MissionMap({ state, dispatch, t }) {
    const lang = state.lang || getLang();
    const patches = state.patches || [];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 14 }}>
            <h1 style={{ fontSize: 26 }}>🗺️ {t('progress.map.title')}</h1>

            <section
                style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    margin: '8px 0 16px',
                }}
                aria-label={t('progress.map.patchSlots')}
            >
                {PATCHES.map((p) => (
                    <PatchBadge
                        key={p.id}
                        id={p.id}
                        earned={patches.includes(p.id)}
                        label={t('progress.patch.' + p.id)}
                    />
                ))}
            </section>

            {WEEKS.map((w) => (
                <section key={w.n} style={{ margin: '14px 0' }}>
                    <h2 style={{ fontSize: 18, margin: '0 0 6px' }}>
                        {w.n === 5 ? '🚀 ' + t('progress.map.launch') : t('progress.map.week' + w.n)}
                    </h2>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
                            gap: 6,
                        }}
                    >
                        {Array.from({ length: w.to - w.from + 1 }, (_, i) => w.from + i).map((day) => {
                            const done = day < state.day;
                            const now = day === state.day;
                            return (
                                <div
                                    key={day}
                                    aria-current={now ? 'step' : undefined}
                                    style={{
                                        borderRadius: 10,
                                        padding: '8px 4px',
                                        textAlign: 'center',
                                        fontSize: 13,
                                        background: now
                                            ? 'var(--accent, #ffcc4d)'
                                            : done
                                                ? '#166534'
                                                : 'var(--card, #161d3d)',
                                        color: now ? '#111' : 'inherit',
                                        fontWeight: now ? 700 : 400,
                                    }}
                                >
                                    <div style={{ fontSize: 18 }}>{phaseIcon(day)}</div>
                                    <div>
                                        {t('progress.map.day')} {day}
                                    </div>
                                    <div style={{ opacity: 0.8 }}>{dateFor(day, lang)}</div>
                                    <div>{done ? '✅' : now ? t('progress.map.now') : ''}</div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ))}

            <p style={{ fontSize: 13, opacity: 0.7 }}>
                ☀️ {t('progress.map.legendDay')} · 🌑 {t('progress.map.legendNight')} · 🌅{' '}
                {t('progress.map.legendSunrise')}
            </p>

            <button
                style={btn}
                onClick={() => dispatch({ type: 'SET_SCREEN', screen: state.mapReturn || 'start' })}
            >
                ← {t('progress.map.back')}
            </button>
        </main>
    );
}

const btn = {
    minHeight: 44,
    padding: '12px 18px',
    borderRadius: 12,
    border: 0,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    background: 'var(--accent, #ffcc4d)',
    color: '#111',
};