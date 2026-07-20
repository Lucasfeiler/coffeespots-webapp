import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shops } from '../prisma/shops-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OUT_FILE = path.join(__dirname, 'geocode-map.json');

if (!API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in server/.env');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findLocation(shop) {
  const query = `${shop.name}, ${shop.address}`;
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'geometry');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.candidates?.length) return null;
  return data.candidates[0].geometry?.location ?? null;
}

async function main() {
  const results = {};
  const failures = [];
  let done = 0;

  for (const shop of shops) {
    done++;
    process.stdout.write(`[${done}/${shops.length}] ${shop.name} (${shop.city})... `);
    try {
      const location = await findLocation(shop);
      if (!location) {
        console.log('no match');
        failures.push(shop.name);
      } else {
        results[shop.slug] = { lat: location.lat, lng: location.lng };
        console.log('done');
      }
    } catch (err) {
      console.log(`error (${err.message})`);
      failures.push(shop.name);
    }
    await sleep(120);
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log('');
  console.log(`Done: ${Object.keys(results).length} geocoded, ${failures.length} failed.`);
  if (failures.length) console.log('Failed:', failures.join(', '));
}

main();
