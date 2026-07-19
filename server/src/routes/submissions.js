import { Router } from 'express';
import { prisma } from '../db.js';

export const submissionsRouter = Router();

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
