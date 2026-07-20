import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shops } from '../prisma/shops-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OUT_DIR = path.join(__dirname, '../../public/images/shops');
const MAP_FILE = path.join(__dirname, 'photo-map.json');

if (!API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in server/.env');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findPhotoReference(shop) {
  const query = `${shop.name}, ${shop.address}`;
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,photos');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'OK' || !data.candidates?.length) {
    return { status: data.status, photoReference: null };
  }

  const candidate = data.candidates[0];
  const photoReference = candidate.photos?.[0]?.photo_reference ?? null;
  return { status: photoReference ? 'OK' : 'NO_PHOTO', photoReference };
}

async function downloadPhoto(photoReference, destPath) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '800');
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photo download failed: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

async function main() {
  const results = {};
  const failures = [];
  let done = 0;

  for (const shop of shops) {
    done++;
    process.stdout.write(`[${done}/${shops.length}] ${shop.name} (${shop.city})... `);

    try {
      const { status, photoReference } = await findPhotoReference(shop);
      if (!photoReference) {
        console.log(`skipped (${status})`);
        failures.push({ slug: shop.slug, name: shop.name, city: shop.city, reason: status });
        await sleep(150);
        continue;
      }

      const destPath = path.join(OUT_DIR, `${shop.slug}.jpg`);
      await downloadPhoto(photoReference, destPath);
      results[shop.slug] = `/images/shops/${shop.slug}.jpg`;
      console.log('done');
    } catch (err) {
      console.log(`error (${err.message})`);
      failures.push({ slug: shop.slug, name: shop.name, city: shop.city, reason: err.message });
    }

    await sleep(150);
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(results, null, 2));

  console.log('');
  console.log(`Done: ${Object.keys(results).length} photos downloaded, ${failures.length} shops skipped.`);
  if (failures.length) {
    console.log('Skipped shops:');
    for (const f of failures) console.log(`  - ${f.name} (${f.city}) — ${f.reason}`);
  }
}

main();
