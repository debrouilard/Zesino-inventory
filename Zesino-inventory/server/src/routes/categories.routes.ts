import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const categoriesRouter = Router();
categoriesRouter.use(requireAuth);

categoriesRouter.get('/', async (_req, res) => {
  const items = await prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  res.json(items);
});

categoriesRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1), description: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const category = await prisma.category.create({ data: parsed.data });
  res.status(201).json(category);
});

categoriesRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const schema = z.object({ name: z.string().min(1).optional(), description: z.string().optional() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const category = await prisma.category.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(category);
});
