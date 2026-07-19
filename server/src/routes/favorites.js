import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const favoritesRouter = Router();

favoritesRouter.use(requireAuth);

favoritesRouter.get('/', async (req, res) => {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user.sub },
    include: { shop: true },
  });
  res.json({ shops: favorites.map((f) => f.shop) });
});

favoritesRouter.post('/:shopId', async (req, res) => {
  const shopId = Number(req.params.shopId);
  const userId = req.user.sub;

  const existing = await prisma.favorite.findUnique({
    where: { userId_shopId: { userId, shopId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return res.json({ favorited: false });
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });

  await prisma.favorite.create({ data: { userId, shopId } });
  res.json({ favorited: true });
});
