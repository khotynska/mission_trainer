// Переклади. Кожен екран має свій файл: src/i18n/<lang>/<namespace>.json
// Використання: t('decision.title'), t('common.day', { n: 3 }), t('days.day3.text')
// Якщо ключа немає — повертається сам ключ (видно, що забули переклад).
//
// Запасний текст дня: якщо немає days.dayN.text / days.dayN.lesson,
// береться days.events.<mainEvent дня N>.text / .lesson (напр. days.events.SEP.text).
// Формат у src/i18n/<lang>/days.json (заповнює Content):
//   "events": { "SEP": { "text": "...", "lesson": "..." }, "QUIET": { ... } }
// Ключі — типи з EVENT_TYPES (src/game/contracts.js).
// Типи подій дня рушій реєструє через registerDayEvents(days) (див. src/game/reducer.js).
const files = import.meta.glob('./*/*.json', { eager: true });

const dict = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lang, ns] = path.match(/\.\/(\w+)\/(\w+)\.json$/);
  dict[lang] ??= {};
  dict[lang][ns] = mod.default;
}

// day number -> mainEvent ('QUIET' | 'M' | ... ), з days.json
const dayEvents = {};
export function registerDayEvents(days) {
  for (const d of days) dayEvents[d.day] = d.mainEvent;
}

const lookup = (lang, key) => key.split('.').reduce((o, k) => o?.[k], dict[lang]);

function lookupWithFallback(lang, key) {
  const value = lookup(lang, key);
  if (typeof value === 'string') return value;
  const m = key.match(/^days\.day(\d+)\.(text|lesson)$/);
  const event = m && dayEvents[Number(m[1])];
  return event ? lookup(lang, `days.events.${event}.${m[2]}`) : value;
}

export function makeT(lang) {
  return function t(key, params = {}) {
    const value = lookupWithFallback(lang, key) ?? key;
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (_, p) => params[p] ?? `{${p}}`);
  };
}
