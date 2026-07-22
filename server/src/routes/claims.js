import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimit.js';

export const claimsRouter = Router();

claimsRouter.use(requireAuth);

function requireBusiness(req, res, next) {
  if (req.userAccountType !== 'business') return res.status(403).json({ error: 'Business account required' });
  next();
}

claimsRouter.use(async (req, res, next) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { accountType: true } });
  req.userAccountType = user?.accountType;
  next();
});

claimsRouter.get('/mine', async (req, res) => {
  const claims = await prisma.shopClaim.findMany({
    where: { userId: req.user.sub },
    include: { shop: { select: { slug: true, name: true, city: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ claims });
});

claimsRouter.post('/', requireBusiness, writeLimiter, async (req, res) => {
  const { shopId, message } = req.body;
  const id = Number(shopId);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'shopId is required' });

  const shop = await prisma.shop.findUnique({ where: { id } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  if (shop.ownerId) return res.status(409).json({ error: 'This shop has already been claimed' });

  try {
    const claim = await prisma.shopClaim.create({
      data: { userId: req.user.sub, shopId: id, message: message?.trim() || null },
    });
    res.status(201).json({ claim });
  } catch (e) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'You already have a claim on this shop' });
    }
    throw e;
  }
});

claimsRouter.get('/', requireAdmin, async (req, res) => {
  const claims = await prisma.shopClaim.findMany({
    include: {
      shop: { select: { slug: true, name: true, city: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ claims });
});

claimsRouter.patch('/:id/approve', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const claim = await prisma.shopClaim.findUnique({ where: { id } });
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status !== 'pending') return res.status(400).json({ error: `Claim is already ${claim.status}` });

  await prisma.$transaction([
    prisma.shop.update({ where: { id: claim.shopId }, data: { ownerId: claim.userId } }),
    prisma.shopClaim.update({ where: { id }, data: { status: 'approved' } }),
    prisma.shopClaim.updateMany({
      where: { shopId: claim.shopId, id: { not: id }, status: 'pending' },
      data: { status: 'rejected' },
    }),
  ]);

  res.json({ ok: true });
});

claimsRouter.patch('/:id/reject', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const claim = await prisma.shopClaim.findUnique({ where: { id } });
  if (!claim) return res.status(404).json({ error: 'Claim not found' });
  if (claim.status !== 'pending') return res.status(400).json({ error: `Claim is already ${claim.status}` });

  await prisma.shopClaim.update({ where: { id }, data: { status: 'rejected' } });
  res.json({ ok: true });
});
