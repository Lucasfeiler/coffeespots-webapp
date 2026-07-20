import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const OUT_DIR = path.join(__dirname, '../../public/images/cities');

const cities = [
  { slug: 'munich', query: 'Munich, Germany' },
  { slug: 'berlin', query: 'Berlin, Germany' },
  { slug: 'vienna', query: 'Vienna, Austria' },
  { slug: 'hamburg', query: 'Hamburg, Germany' },
  { slug: 'zurich', query: 'Zurich, Switzerland' },
];

if (!API_KEY) {
  console.error('GOOGLE_PLACES_API_KEY is not set in server/.env');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

async function findPhotoReference(query) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  url.searchParams.set('input', query);
  url.searchParams.set('inputtype', 'textquery');
  url.searchParams.set('fields', 'place_id,photos');
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK' || !data.candidates?.length) return null;
  return data.candidates[0].photos?.[0]?.photo_reference ?? null;
}

async function downloadPhoto(photoReference, destPath) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '1200');
  url.searchParams.set('photo_reference', photoReference);
  url.searchParams.set('key', API_KEY);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Photo download failed: ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  for (const city of cities) {
    process.stdout.write(`${city.slug}... `);
    const photoReference = await findPhotoReference(city.query);
    if (!photoReference) {
      console.log('no photo found');
      continue;
    }
    await downloadPhoto(photoReference, path.join(OUT_DIR, `${city.slug}.jpg`));
    console.log('done');
  }
}

main();
