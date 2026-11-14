// Перевірка days.json за контрактом (розділ 1 у contracts.js). Власник: Tech Lead.
// Повертає масив рядків: помилки, а попередження — з префіксом "WARN:".
// Без залежностей від браузера/i18n — можна запускати в Node.
import { EVENT_TYPES } from './contracts.js';

const TOTAL_DAYS = 30;
const isInt = (n) => Number.isInteger(n);

export function validateDays(days) {
  const issues = [];
  if (!Array.isArray(days)) return ['days: очікується масив'];

  if (days.length < TOTAL_DAYS) {
    issues.push(`WARN: днів ${days.length} замість ${TOTAL_DAYS} (фейкові дані?)`);
  } else if (days.length > TOTAL_DAYS) {
    issues.push(`днів ${days.length}, має бути рівно ${TOTAL_DAYS}`);
  }

  days.forEach((d, i) => {
    const at = `days[${i}]`;
    if (!d || typeof d !== 'object') {
      issues.push(`${at}: очікується об'єкт`);
      return;
    }
    if (d.day !== i + 1) issues.push(`${at}: day = ${d.day}, очікується ${i + 1} (дні 1..${TOTAL_DAYS} по порядку)`);
    if (typeof d.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
      issues.push(`${at}: date "${d.date}" не у форматі YYYY-MM-DD`);
    }
    if (!isInt(d.week) || d.week < 1 || d.week > 5) issues.push(`${at}: week = ${d.week}, має бути 1–5`);
    if (d.phase !== 'day' && d.phase !== 'night') issues.push(`${at}: phase = "${d.phase}", має бути 'day' або 'night'`);
    if (!EVENT_TYPES.includes(d.mainEvent)) {
      issues.push(`${at}: mainEvent = "${d.mainEvent}", має бути один з ${EVENT_TYPES.join(', ')}`);
    }
    if (!Array.isArray(d.donkiIds)) issues.push(`${at}: donkiIds має бути масивом`);
    if (!Array.isArray(d.cmeLaunched)) {
      issues.push(`${at}: cmeLaunched має бути масивом`);
    } else {
      d.cmeLaunched.forEach((c, j) => {
        const a = c?.arrivalDay;
        if (!isInt(a) || a <= d.day) {
          issues.push(`${at}.cmeLaunched[${j}]: arrivalDay = ${a}, має бути цілим числом більше за ${d.day}`);
        }
      });
    }
  });

  return issues;
}
