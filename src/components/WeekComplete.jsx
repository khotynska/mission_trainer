import { useEffect, useState } from 'react';
import { PatchBadge } from './MissionMap';
import { addPatch, saveWeekResult, getBestWeek } from '../game/storage';

const PATCH_BY_WEEK = { 1: 'energy', 2: 'science', 3: 'night', 4: 'shield' };

// Читає state.lastWeekResult = { week, passed, patch } (+ необов'язково doseGain).
export default function WeekComplete({ state, dispatch, t }) {
    const r = state.lastWeekResult || { week: 1, passed: false, patch: null };
    const patch = r.patch || PATCH_BY_WEEK[r.week];
    const [cmp, setCmp] = useState(null);

    useEffect(() => {
        if (r.passed && patch) addPatch(patch);
        // Приріст дози за тиждень: з lastWeekResult, якщо рушій його дає.
        if (typeof r.doseGain === 'number') {
            const best = getBestWeek(r.week);
            const res = saveWeekResult(r.week, r.doseGain);
            setCmp({ gain: r.doseGain, best: res.isNewBest ? r.doseGain : best, isNewBest: res.isNewBest });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <main style={{ maxWidth: 640, margin: '0 auto', padding: 14, textAlign: 'center' }}>
            <h1 style={{ fontSize: 26 }}>{t('progress.week.title', { week: r.week })}</h1>

            {r.passed ? (
                <>
                    <div style={{ animation: 'pop 0.6s ease-out', margin: '16px 0' }}>
                        <PatchBadge id={patch} size={96} label={t('progress.patch.' + patch)} />
                    </div>
                    <h2>{t('progress.patch.' + patch)}</h2>
                    <p>{t('progress.week.earned')}</p>
                </>
            ) : (
                <>
                    <p style={{ fontSize: 20 }}>{t('progress.week.notEarned')}</p>
                    <p style={{ opacity: 0.85 }}>
                        {t('progress.week.goalWas')} {t('progress.week.goal' + r.week)}
                    </p>
                </>
            )}

            {cmp && (
                <p style={{ opacity: 0.9 }}>
                    {t('progress.week.yourDose', { dose: Math.round(cmp.gain * 10) / 10 })}{' '}
                    {cmp.isNewBest
                        ? t('progress.week.newBest')
                        : t('progress.week.best', { dose: Math.round(cmp.best * 10) / 10 })}
                </p>
            )}

            <button style={btn} onClick={() => dispatch({ type: 'CONTINUE' })}>
                {t('progress.week.next')} →
            </button>

            <style>{`@keyframes pop{0%{transform:scale(0.2);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}`}</style>
        </main>
    );
}

const btn = {
    minHeight: 48,
    padding: '12px 22px',
    borderRadius: 12,
    border: 0,
    fontWeight: 700,
    fontSize: 17,
    cursor: 'pointer',
    background: 'var(--accent, #ffcc4d)',
    color: '#111',
    marginTop: 16,
};