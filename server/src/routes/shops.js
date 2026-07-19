import { Router } from 'express';
import { prisma } from '../db.js';

export const shopsRouter = Router();

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

shopsRouter.get('/', async (req, res) => {
  const { city, tag, query, openNow } = req.query;

  const shops = await prisma.shop.findMany({ orderBy: { id: 'asc' } });

  const todayKey = dayKeys[new Date().getDay()];
  const filtered = shops.filter((s) => {
    if (city && s.city !== city) return false;
    if (tag && !s.tags.includes(tag)) return false;
    if (query && !`${s.name} ${s.neighborhood ?? ''} ${s.address}`.toLowerCase().includes(String(query).toLowerCase())) return false;
    if (openNow === 'true' && !(s.hours && s.hours[todayKey])) return false;
    return true;
  });

  res.json({ shops: filtered });
});

shopsRouter.get('/meta', async (_req, res) => {
  const shops = await prisma.shop.findMany({ select: { city: true, tags: true } });
  const cities = Array.from(new Set(shops.map((s) => s.city))).sort();
  const allTags = Array.from(new Set(shops.flatMap((s) => s.tags))).sort();
  res.json({ cities, allTags });
});

shopsRouter.get('/:slug', async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { slug: req.params.slug } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json({ shop });
});
