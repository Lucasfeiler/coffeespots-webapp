import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { shops } from '../prisma/shops-data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OUT_DIR = path.join(__dirname, '../../public/images/shops/gallery');
const MAP_FILE = path.join(__dirname, 'gallery-map.json');
const MAX_PHOTOS_PER_SHOP = 5;

if (!API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in server/.env');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function findPhotoReferences(shop) {
  const query = `${shop.name}, ${shop.address}`;
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,photos');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.candidates?.length) return [];
  const photos = data.candidates[0].photos ?? [];
  return photos.slice(0, MAX_PHOTOS_PER_SHOP).map((p) => p.photo_reference);
}

async function downloadPhoto(photoReference, destPath) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '1000');
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photo download failed: ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const results = {};
  const failures = [];
  let done = 0;
  let totalPhotos = 0;

  for (const shop of shops) {
    done++;
    process.stdout.write(`[${done}/${shops.length}] ${shop.name} (${shop.city})... `);

    try {
      const refs = await findPhotoReferences(shop);
      if (refs.length === 0) {
        console.log('no photos found');
        failures.push(shop.name);
        await sleep(150);
        continue;
      }

      const paths = [];
      for (let i = 0; i < refs.length; i++) {
        const destPath = path.join(OUT_DIR, `${shop.slug}-${i + 1}.jpg`);
        await downloadPhoto(refs[i], destPath);
        paths.push(`/images/shops/gallery/${shop.slug}-${i + 1}.jpg`);
        await sleep(120);
      }
      results[shop.slug] = paths;
      totalPhotos += paths.length;
      console.log(`done (${paths.length} photos)`);
    } catch (err) {
      console.log(`error (${err.message})`);
      failures.push(shop.name);
    }

    await sleep(150);
  }

  fs.writeFileSync(MAP_FILE, JSON.stringify(results, null, 2));

  console.log('');
  console.log(`Done: ${Object.keys(results).length} shops, ${totalPhotos} total photos. ${failures.length} shops skipped.`);
  if (failures.length) {
    console.log('Skipped:', failures.join(', '));
  }
}

main();
