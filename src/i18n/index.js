// Переклади. Кожен екран має свій файл: src/i18n/<lang>/<namespace>.json
// Використання: t('decision.title'), t('common.day', { n: 3 }), t('days.day3.text')
// Якщо ключа немає — повертається сам ключ (видно, що забули переклад).
const files = import.meta.glob('./*/*.json', { eager: true });

const dict = {};
for (const [path, mod] of Object.entries(files)) {
  const [, lang, ns] = path.match(/\.\/(\w+)\/(\w+)\.json$/);
  dict[lang] ??= {};
  dict[lang][ns] = mod.default;
}

export function makeT(lang) {
  return function t(key, params = {}) {
    const value = key.split('.').reduce((o, k) => o?.[k], dict[lang]) ?? key;
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (_, p) => params[p] ?? `{${p}}`);
  };
}
