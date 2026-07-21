import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { randomUUID, randomBytes } from 'node:crypto';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getStorageBucket } from '../firebase.js';
import { sendPasswordResetEmail } from '../mailer.js';

export const authRouter = Router();

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

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function publicUser(user, visitCount = 0) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    location: user.location,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    visitCount,
  };
}

authRouter.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password, and name are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, name } });

  res.status(201).json({ token: issueToken(user), user: publicUser(user) });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const visitCount = await prisma.visit.count({ where: { userId: user.id } });
  res.json({ token: issueToken(user), user: publicUser(user, visitCount) });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const visitCount = await prisma.visit.count({ where: { userId: user.id } });
  res.json({ user: publicUser(user, visitCount) });
});

authRouter.patch('/me', requireAuth, async (req, res) => {
  const { name, location, bio } = req.body;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  const user = await prisma.user.update({
    where: { id: req.user.sub },
    data: {
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(location !== undefined ? { location: location.trim() || null } : {}),
      ...(bio !== undefined ? { bio: bio.trim() || null } : {}),
    },
  });

  const visitCount = await prisma.visit.count({ where: { userId: user.id } });
  res.json({ user: publicUser(user, visitCount) });
});

authRouter.post('/me/photo', requireAuth, (req, res) => {
  upload.single('photo')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });

    try {
      const ext = req.file.mimetype.split('/')[1];
      const filename = `avatars/${req.user.sub}-${randomUUID()}.${ext}`;
      const bucket = getStorageBucket();
      const blob = bucket.file(filename);

      await blob.save(req.file.buffer, { contentType: req.file.mimetype });
      await blob.makePublic();
      const avatarUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      const user = await prisma.user.update({ where: { id: req.user.sub }, data: { avatarUrl } });
      const visitCount = await prisma.visit.count({ where: { userId: user.id } });
      res.json({ user: publicUser(user, visitCount) });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  });
});

authRouter.patch('/me/email', requireAuth, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== user.id) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  const updated = await prisma.user.update({ where: { id: user.id }, data: { email } });
  const visitCount = await prisma.visit.count({ where: { userId: user.id } });
  res.json({ token: issueToken(updated), user: publicUser(updated, visitCount) });
});

authRouter.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const user = await prisma.user.findUnique({ where: { email } });
  let debugInfo = { userFound: !!user };
  // Always respond the same way whether or not the account exists, so this
  // endpoint can't be used to check which emails have accounts.
  if (user) {
    const token = randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const resetUrl = `${process.env.CLIENT_ORIGIN}/reset-password?token=${token}`;
    try {
      const result = await sendPasswordResetEmail(user.email, resetUrl);
      debugInfo.sendResult = result;
    } catch (e) {
      console.error('Failed to send password reset email', e);
      debugInfo.sendError = e.message;
    }
  }

  res.json({ ok: true, debugInfo });
});

authRouter.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'token and password are required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ ok: true });
});

authRouter.delete('/me', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required to delete your account' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const reviews = await prisma.review.findMany({ where: { userId: req.user.sub }, select: { shopId: true } });
  await prisma.user.delete({ where: { id: req.user.sub } });

  for (const shopId of new Set(reviews.map((r) => r.shopId))) {
    const agg = await prisma.review.aggregate({ where: { shopId }, _avg: { rating: true }, _count: { rating: true } });
    await prisma.shop.update({ where: { id: shopId }, data: { rating: agg._avg.rating ?? 0, reviewCount: agg._count.rating } });
  }

  res.status(204).end();
});
