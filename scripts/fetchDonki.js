// Власник: Data Engineer. Завантажує сирі дані DONKI один раз.
// Запуск: NASA_KEY=твій_ключ node scripts/fetchDonki.js

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const START = '2024-04-17';
const END = '2024-05-16';
const TYPES = [
  'FLR',
  'CME',
  'SEP',
  'GST',
  'IPS',
  'WSAEnlilSimulations',
];
const CCMC = 'https://ccmc.gsfc.nasa.gov/DONKI/WS/get';
const NASA = 'https://api.nasa.gov/DONKI';
const KEY = process.env.NASA_KEY;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'raw');
async function getJson(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      return text.trim() ? JSON.parse(text) : [];
    }
    console.warn(`  ${res.status} on attempt ${attempt}: ${url.replace(KEY ?? '###', '***')}`);
    await new Promise((r) => setTimeout(r, 2000 * attempt));
  }
  throw new Error(`Failed: ${url.replace(KEY ?? '###', '***')}`);
}
async function fetchType(type) {
  const query = `startDate=${START}&endDate=${END}`;
  try {
    return await getJson(`${CCMC}/${type}?${query}`);
  } catch (err) {
    if (!KEY) throw err;
    console.warn(`  CCMC failed for ${type}, trying api.nasa.gov`);
    return await getJson(`${NASA}/${type}?${query}&api_key=${KEY}`);
  }
}
async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`DONKI ${START} → ${END}\n`);
  for (const type of TYPES) {
    const data = await fetchType(type);
    const file = join(OUT_DIR, `${type}.json`);
    await writeFile(file, JSON.stringify(data, null, 2));
    console.log(`✓ ${type.padEnd(20)} ${String(data.length).padStart(4)} records → scripts/raw/${type}.json`);
  }
  console.log('\nDone. Next step: node scripts/buildDays.js');
}
main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
