// Ключі текстів рівня (src/i18n/<lang>/levels.json). Окремий модуль, щоб файли екранів експортували лише компоненти.

/** Питання дня. */
export function levelText(t, briefing) {
  const lv = briefing.level;
  if (lv.kind === 'chore') return t(briefing.phase === 'night' ? 'levels.q.chore_night' : 'levels.q.chore_day');
  return t(`levels.q.day${briefing.day}`, { h: lv.leadHours });
}

/** Напис на кнопці варіанта. */
export function optionLabel(t, briefing, option) {
  return option.chore ? t(`levels.chore.${option.id}.label`) : t(`levels.opt.day${briefing.day}.${option.id}`);
}

/** Реакція Ліри після вибору. */
export function reactionText(t, briefing, choice) {
  if (choice.timedOut) return t('levels.timeout');
  if (choice.chore) return t(`levels.chore.${choice.id}.react`);
  return t(`levels.react.day${briefing.day}.${choice.id}`);
}
