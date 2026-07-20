import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { getMessagingInstance } from '../firebase.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.post('/register', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  await prisma.deviceToken.upsert({
    where: { token },
    update: { userId: req.user.sub },
    create: { token, userId: req.user.sub },
  });

  res.status(201).json({ ok: true });
});

notificationsRouter.post('/test', async (req, res) => {
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: req.user.sub },
    select: { token: true },
  });

  if (tokens.length === 0) {
    return res.status(400).json({ error: 'No registered device for this account' });
  }

  const messaging = getMessagingInstance();
  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: {
      title: 'CoffeeSpots',
      body: "Notifications are working! You'll hear from us about new shops and updates.",
    },
  });

  const deadTokens = [];
  response.responses.forEach((r, i) => {
    if (!r.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(r.error?.code)) {
      deadTokens.push(tokens[i].token);
    }
  });
  if (deadTokens.length) {
    await prisma.deviceToken.deleteMany({ where: { token: { in: deadTokens } } });
  }

  res.json({ sent: response.successCount, failed: response.failureCount });
});
