// Збереження прогресу (нашивки, мова) у localStorage. Власник: Dev 6.
const KEY = 'junior-astronaut-progress';

export function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { patches: [], lang: 'ua' };
  } catch {
    return { patches: [], lang: 'ua' };
  }
}

export function saveProgress({ patches, lang }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ patches, lang }));
  } catch {
    /* localStorage недоступний — гра працює без збереження */
  }
}
