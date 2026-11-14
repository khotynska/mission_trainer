// Власник: Dev 6 (Progress UI). Пропси за контрактом: { state, dispatch, t } (src/game/contracts.js).
import { useState } from 'react';
import { ACTIONS } from '../game/contracts.js';
import { getRank } from '../game/gameEngine'; // лише імпорт, змінювати не можна
import PatchBadge from './PatchBadge.jsx';
import { PATCHES } from './patches.js';
import { getPlayerName, savePlayerName } from '../game/storage';

const RANK_VIEW = {
    bronze: { icon: '🥉', color: '#cd7f32' },
    silver: { icon: '🥈', color: '#c0c0c0' },
    gold: { icon: '🥇', color: '#ffd700' },
};

export default function Certificate({ state, dispatch, t }) {
    const [name, setName] = useState(getPlayerName);
    // Дата видачі фіксується один раз (рендер має бути чистим — без new Date() при кожному рендері)
    const [issuedAt] = useState(() => new Date());
    const raw = getRank(state);
    // getRank може повертати 'bronze' | 'silver' | 'gold' (рядок) або об'єкт: підтримуємо обидва.
    const rankId = String((raw && raw.id) || raw || 'bronze').toLowerCase();
    const rank = RANK_VIEW[rankId] || RANK_VIEW.bronze;
    const patches = state.patches || [];
    const lang = state.lang === 'en' ? 'en-GB' : 'uk-UA';

    return (
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 14 }}>
            <section
                style={{
                    border: `4px solid ${rank.color}`,
                    borderRadius: 20,
                    padding: 20,
                    textAlign: 'center',
                    background: 'var(--card, #161d3d)',
                }}
            >
                <div style={{ fontSize: 56 }}>{rank.icon}</div>
                <h1 style={{ fontSize: 26, margin: '6px 0' }}>{t('progress.cert.title')}</h1>
                <h2 style={{ color: rank.color, margin: '4px 0' }}>{t('progress.cert.rank_' + rankId)}</h2>

                <input
                    value={name}
                    maxLength={30}
                    placeholder={t('progress.cert.name')}
                    aria-label={t('progress.cert.name')}
                    onChange={(e) => {
                        setName(e.target.value);
                        savePlayerName(e.target.value);
                    }}
                    style={{
                        font: 'inherit',
                        fontSize: 20,
                        textAlign: 'center',
                        padding: 10,
                        margin: '12px 0',
                        width: '100%',
                        maxWidth: 360,
                        borderRadius: 10,
                        border: '2px dashed var(--accent, #ffcc4d)',
                        background: 'transparent',
                        color: 'inherit',
                    }}
                />

                <p>{t('progress.cert.text')}</p>
                <p>
                    🔬 {t('progress.cert.science')}: <b>{state.science}</b> · ☢️ {t('progress.cert.dose')}:{' '}
                    <b>{Math.round((state.dose || 0) * 10) / 10}</b>
                </p>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '10px 0' }}>
                    {PATCHES.map((p) => (
                        <PatchBadge key={p.id} id={p.id} earned={patches.includes(p.id)} label={t('progress.patch.' + p.id)} />
                    ))}
                </div>

                <p style={{ opacity: 0.7, fontSize: 14 }}>{issuedAt.toLocaleDateString(lang)}</p>
                <p style={{ opacity: 0.8, fontSize: 14 }}>{t('progress.cert.mars')}</p>
            </section>

            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button type="button" style={btn} onClick={() => window.print()}>
                    🖨️ {t('progress.cert.print')}
                </button>
                <button type="button" style={{ ...btn, background: 'var(--space-raised, #2a3366)', color: 'inherit' }} onClick={() => dispatch({ type: ACTIONS.START_GAME })}>
                    🔁 {t('progress.cert.again')}
                </button>
            </div>

            <style>{`@media print{.no-print{display:none!important}body{background:#fff!important;color:#000!important}}`}</style>
        </main>
    );
}

const btn = {
    minHeight: 48,
    padding: '12px 18px',
    borderRadius: 12,
    border: 0,
    fontWeight: 700,
    fontSize: 16,
    cursor: 'pointer',
    background: 'var(--accent, #ffcc4d)',
    color: '#111',
};