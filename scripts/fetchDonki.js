// Власник: Data Engineer. Завантажує сирі дані DONKI один раз.
// Запуск: NASA_KEY=твій_ключ node scripts/fetchDonki.js
import fs from 'fs';

const KEY = process.env.NASA_KEY || 'DEMO_KEY';
const START = '2024-04-17';
const END = '2024-05-16';
const TYPES = ['FLR', 'CME', 'SEP', 'GST'];

const raw = {};
for (const type of TYPES) {
  const url = `https://api.nasa.gov/DONKI/${type}?startDate=${START}&endDate=${END}&api_key=${KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${type}: HTTP ${res.status}`);
  raw[type] = await res.json();
  console.log(`${type}: ${raw[type].length} events`);
}

fs.mkdirSync('scripts/raw', { recursive: true });
fs.writeFileSync(`scripts/raw/donki_${START}_${END}.json`, JSON.stringify(raw, null, 2));
console.log('Saved. Next: node scripts/buildDays.js');
