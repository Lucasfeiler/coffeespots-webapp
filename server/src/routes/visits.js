import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

export const visitsRouter = Router();

visitsRouter.use(requireAuth);

visitsRouter.get('/', async (req, res) => {
  const visits = await prisma.visit.findMany({
    where: { userId: req.user.sub },
    include: { shop: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ shops: visits.map((v) => v.shop) });
});

visitsRouter.post('/:shopId', async (req, res) => {
  const shopId = Number(req.params.shopId);
  const userId = req.user.sub;

  const existing = await prisma.visit.findUnique({
    where: { userId_shopId: { userId, shopId } },
  });

  if (existing) {
    await prisma.visit.delete({ where: { id: existing.id } });
    return res.json({ visited: false });
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });

  await prisma.visit.create({ data: { userId, shopId } });
  res.json({ visited: true });
});
