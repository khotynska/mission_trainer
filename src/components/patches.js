// Власник: Dev 6 (Progress UI). Нашивки тижнів і значки досягнень.
// Ключі збігаються зі state.patches (WEEK_GOALS у src/game/config.js і award() у src/game/reducer.js).
// Окремий модуль (не компонент), щоб файли екранів експортували лише компоненти (Fast Refresh, lint).
// Мапа місії, старт і сертифікат показують усі значки з цього списку.
export const PATCHES = Object.freeze([
    { id: 'energy', icon: '⚡', week: 1 },
    { id: 'science', icon: '🔬', week: 2 },
    { id: 'night', icon: '🌙', week: 3 },
    { id: 'shield', icon: '🛡️', week: 4 },
    // Значки за досягнення (не прив'язані до тижня)
    { id: 'first_steps', icon: '👣' },
    { id: 'shelter_pro', icon: '🏃' },
    { id: 'quick', icon: '⏱️' },
    { id: 'may_storm', icon: '🌪️' },
    { id: 'low_dose', icon: '💚' },
    { id: 'graduate', icon: '🎓' },
]);

/** Номер тижня → id нашивки, напр. { 1: 'energy', … }. */
export const PATCH_BY_WEEK = Object.freeze(
    Object.fromEntries(PATCHES.filter((p) => p.week).map((p) => [p.week, p.id])),
);

/** id нашивок тижнів: їх святкує екран тижня, тож тост «новий значок» для них не потрібен. */
export const WEEK_PATCH_IDS = Object.freeze(PATCHES.filter((p) => p.week).map((p) => p.id));
