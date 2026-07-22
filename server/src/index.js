import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { shopsRouter } from './routes/shops.js';
import { favoritesRouter } from './routes/favorites.js';
import { reviewsRouter } from './routes/reviews.js';
import { submissionsRouter } from './routes/submissions.js';
import { nearbyRouter } from './routes/nearby.js';
import { visitsRouter } from './routes/visits.js';
import { notificationsRouter } from './routes/notifications.js';
import { claimsRouter } from './routes/claims.js';

const app = express();
app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/shops/:slug/reviews', reviewsRouter);
app.use('/api/favorites', favoritesRouter);
app.use('/api/submissions', submissionsRouter);
app.use('/api/nearby', nearbyRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/claims', claimsRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`coffeespots API listening on http://localhost:${port}`));
