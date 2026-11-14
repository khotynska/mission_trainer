// Власник: Dev 6 (Progress UI). Нашивки тижнів: ключі збігаються зі state.patches і WEEK_GOALS у src/game/config.js.
// Окремий модуль (не компонент), щоб файли екранів експортували лише компоненти (Fast Refresh, lint).
export const PATCHES = Object.freeze([
    { id: 'energy', icon: '⚡', week: 1 },
    { id: 'science', icon: '🔬', week: 2 },
    { id: 'night', icon: '🌙', week: 3 },
    { id: 'shield', icon: '🛡️', week: 4 },
]);

/** Номер тижня → id нашивки, напр. { 1: 'energy', … }. */
export const PATCH_BY_WEEK = Object.freeze(Object.fromEntries(PATCHES.map((p) => [p.week, p.id])));
