import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { writeLimiter } from '../middleware/rateLimit.js';
import { getStorageBucket } from '../firebase.js';

export const shopsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      return cb(new Error('Photo must be a JPEG, PNG, or WebP image'));
    }
    cb(null, true);
  },
});

const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

async function requireShopOwner(req, res, next) {
  const shop = await prisma.shop.findUnique({ where: { slug: req.params.slug } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  if (shop.ownerId !== req.user.sub) return res.status(403).json({ error: 'You do not manage this shop' });
  req.shop = shop;
  next();
}

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

shopsRouter.get('/mine', requireAuth, async (req, res) => {
  const shops = await prisma.shop.findMany({ where: { ownerId: req.user.sub }, orderBy: { name: 'asc' } });
  res.json({ shops });
});

shopsRouter.get('/:slug', async (req, res) => {
  const shop = await prisma.shop.findUnique({ where: { slug: req.params.slug } });
  if (!shop) return res.status(404).json({ error: 'Shop not found' });
  res.json({ shop });
});

shopsRouter.patch('/:slug', requireAuth, requireShopOwner, writeLimiter, async (req, res) => {
  const { description, tags, hours, website, instagram } = req.body;

  const shop = await prisma.shop.update({
    where: { id: req.shop.id },
    data: {
      ...(description !== undefined ? { description: description?.trim() || null } : {}),
      ...(Array.isArray(tags) ? { tags } : {}),
      ...(hours !== undefined ? { hours } : {}),
      ...(website !== undefined ? { website: website?.trim() || null } : {}),
      ...(instagram !== undefined ? { instagram: instagram?.trim() || null } : {}),
    },
  });

  res.json({ shop });
});

shopsRouter.post('/:slug/photo', requireAuth, requireShopOwner, writeLimiter, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    try {
      const ext = req.file.mimetype.split('/')[1];
      const filename = `shops/${req.shop.id}-${randomUUID()}.${ext}`;
      const bucket = getStorageBucket();
      const blob = bucket.file(filename);

      await blob.save(req.file.buffer, { contentType: req.file.mimetype });
      await blob.makePublic();
      const photoUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      const existingImages = Array.isArray(req.shop.images) ? req.shop.images : [];
      const images = [...existingImages, photoUrl];

      const shop = await prisma.shop.update({
        where: { id: req.shop.id },
        data: { images, image: req.shop.image ?? photoUrl },
      });

      res.json({ shop });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  });
});
