import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const customersRouter = Router();
customersRouter.use(requireAuth);

customersRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '');
  const items = await prisma.customer.findMany({
    where: search
      ? {
          OR: [{ name: { contains: search } }, { email: { contains: search } }, { company: { contains: search } }],
        }
      : {},
    orderBy: { name: 'asc' },
    include: { _count: { select: { sales: true } } },
  });
  res.json(items);
});

customersRouter.post('/', requireRole('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const schema = z.object({
    name: z.string().min(1),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const customer = await prisma.customer.create({ data: parsed.data });
  res.status(201).json(customer);
});
