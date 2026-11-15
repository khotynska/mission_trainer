// Власник: Dev 6 (Progress UI).
// Збереження прогресу в localStorage: нашивки й значки, мова, ім'я, найкращі результати тижнів,
// а також тема (☀️/🌙), звук і чи пройдено інструкцію.
// Працює безпечно, навіть якщо localStorage недоступний (приватний режим тощо).
const KEY = 'junior-astronaut-progress-v1';

const EMPTY = { patches: [], lang: 'ua', name: '', best: {}, theme: 'dark', sound: true, tutorialDone: false };
/** Єдині поля, які зберігаються. Решта (напр. увесь стан гри з App.jsx) ігнорується. */
const FIELDS = Object.keys(EMPTY);

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY, patches: [], best: {} };
    const data = JSON.parse(raw);
    return {
      patches: Array.isArray(data.patches) ? data.patches : [],
      lang: data.lang === 'en' ? 'en' : 'ua',
      name: typeof data.name === 'string' ? data.name : '',
      best: data.best && typeof data.best === 'object' ? data.best : {},
      theme: data.theme === 'light' ? 'light' : 'dark',
      sound: data.sound !== false,
      tutorialDone: data.tutorialDone === true,
    };
  } catch {
    return { ...EMPTY, patches: [], best: {} };
  }
}

// Зливає передані поля з уже збереженими. App.jsx передає сюди весь стан гри (без name і best),
// тож простий перезапис стирав би ім'я гравця й рекорди тижнів.
export function saveProgress(progress) {
  try {
    const next = loadProgress();
    for (const key of FIELDS) {
      if (progress && progress[key] !== undefined) next[key] = progress[key];
    }
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // нічого страшного: гра працює і без збереження
  }
}

// Додає нашивку ('energy' | 'science' | 'night' | 'shield'), якщо її ще немає.
export function addPatch(patch) {
  const p = loadProgress();
  if (patch && !p.patches.includes(patch)) {
    p.patches.push(patch);
    saveProgress(p);
  }
  return p.patches;
}

export function getPatches() {
  return loadProgress().patches;
}

export function saveLang(lang) {
  const p = loadProgress();
  p.lang = lang === 'en' ? 'en' : 'ua';
  saveProgress(p);
}

export function getLang() {
  return loadProgress().lang;
}

export function savePlayerName(name) {
  const p = loadProgress();
  p.name = String(name || '').slice(0, 30);
  saveProgress(p);
}

export function getPlayerName() {
  return loadProgress().name;
}

// Найкращий результат тижня = найменший приріст дози (менше це краще).
// Повертає { previous, isNewBest } для порівняння на екрані тижня.
export function saveWeekResult(week, doseGain) {
  const p = loadProgress();
  const previous = p.best[week] ? p.best[week].doseGain : null;
  const isNewBest = previous === null || doseGain < previous;
  if (isNewBest) {
    p.best[week] = { doseGain };
    saveProgress(p);
  }
  return { previous, isNewBest };
}

export function getBestWeek(week) {
  const p = loadProgress();
  return p.best[week] ? p.best[week].doseGain : null;
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // недоступне сховище — нічого очищати
  }
}