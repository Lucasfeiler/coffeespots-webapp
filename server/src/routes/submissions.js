import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

export const submissionsRouter = Router();

const DIACRITICS = new RegExp('[̀-ͯ]', 'g');

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(DIACRITICS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

submissionsRouter.post('/', async (req, res) => {
  const { name, city, neighborhood, address, description } = req.body;
  if (!name || !city || !address) {
    return res.status(400).json({ error: 'name, city, and address are required' });
  }

  const submission = await prisma.submission.create({
    data: {
      name,
      city,
      neighborhood: neighborhood || null,
      address,
      description: description || null,
    },
  });

  res.status(201).json({ submission });
});

submissionsRouter.get('/', requireAuth, requireAdmin, async (req, res) => {
  const submissions = await prisma.submission.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ submissions });
});

submissionsRouter.patch('/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (submission.status !== 'pending') {
    return res.status(400).json({ error: `Submission is already ${submission.status}` });
  }

  const baseSlug = slugify(submission.name);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const [shop] = await prisma.$transaction([
    prisma.shop.create({
      data: {
        slug,
        name: submission.name,
        city: submission.city,
        neighborhood: submission.neighborhood,
        address: submission.address,
        description: submission.description,
        placeholder: true,
      },
    }),
    prisma.submission.update({ where: { id }, data: { status: 'approved' } }),
  ]);

  res.json({ shop });
});

submissionsRouter.patch('/:id/reject', requireAuth, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) return res.status(404).json({ error: 'Submission not found' });
  if (submission.status !== 'pending') {
    return res.status(400).json({ error: `Submission is already ${submission.status}` });
  }

  await prisma.submission.update({ where: { id }, data: { status: 'rejected' } });
  res.json({ ok: true });
});
