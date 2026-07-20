import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const map = JSON.parse(fs.readFileSync(path.join(__dirname, 'photo-map.json'), 'utf-8'));
  const slugs = Object.keys(map);

  let updated = 0;
  for (const slug of slugs) {
    const result = await prisma.shop.updateMany({
      where: { slug },
      data: { image: map[slug] },
    });
    updated += result.count;
  }

  console.log(`Updated ${updated} of ${slugs.length} shops with image paths.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
