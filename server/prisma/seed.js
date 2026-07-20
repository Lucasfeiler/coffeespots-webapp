import { PrismaClient } from '@prisma/client';
import { shops } from './shops-data.js';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.shop.count();
  if (count > 0) {
    console.log(`Shop table already has ${count} rows — skipping seed. Run "npx prisma migrate reset" first if you want to reseed.`);
    return;
  }

  for (const s of shops) {
    await prisma.shop.create({
      data: {
        slug: s.slug,
        name: s.name,
        city: s.city,
        neighborhood: s.neighborhood ?? null,
        address: s.address,
        description: s.description ?? null,
        tags: s.tags ?? [],
        hours: s.hours ?? null,
        website: s.website ?? null,
        instagram: s.instagram ?? null,
        image: s.image ?? null,
        placeholder: !!s.placeholder,
        rating: s.rating ?? 0,
        reviewCount: s.reviewCount ?? 0,
      },
    });
  }

  console.log(`Seeded ${shops.length} shops.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
