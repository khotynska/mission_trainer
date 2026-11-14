// Екран евакуації: поразка без покарання. Причина береться зі state.endReason ('dose' | 'life').
export default function Evacuation({ state, dispatch, t }) {
    const reason = state.endReason === 'life' ? 'life' : 'dose';

    return (
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 14, textAlign: 'center' }}>
            <div style={{ fontSize: 64 }}>🚑</div>
            <h1 style={{ fontSize: 26 }}>{t('progress.evac.title')}</h1>
            <p style={{ fontSize: 18 }}>
                {t('progress.evac.reason')}:{' '}
                <b>{reason === 'dose' ? t('progress.evac.reasonDose') : t('progress.evac.reasonLife')}</b>
            </p>
            <p style={{ lineHeight: 1.5 }}>{t('progress.evac.text')}</p>
            <p style={{ fontSize: 14, opacity: 0.8 }}>{t('progress.evac.patchesSafe')}</p>
            <button
                style={{
                    minHeight: 48,
                    padding: '12px 22px',
                    borderRadius: 12,
                    border: 0,
                    fontWeight: 700,
                    fontSize: 17,
                    cursor: 'pointer',
                    background: 'var(--accent, #ffcc4d)',
                    color: '#111',
                }}
                onClick={() => dispatch({ type: 'RESTART_WEEK' })}
            >
                🔁 {t('progress.evac.restart')}
            </button>
        </main>
    );
}