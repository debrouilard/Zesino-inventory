import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const suppliersRouter = Router();
suppliersRouter.use(requireAuth);

const supplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isLocal: z.boolean().optional(),
  active: z.boolean().optional(),
});

suppliersRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '');
  const isLocal = req.query.isLocal === 'true' ? true : req.query.isLocal === 'false' ? false : undefined;

  const items = await prisma.supplier.findMany({
    where: {
      AND: [
        search ? { name: { contains: search } } : {},
        isLocal !== undefined ? { isLocal } : {},
      ],
    },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true, purchases: true } } },
  });
  res.json(items);
});

suppliersRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const parsed = supplierSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const supplier = await prisma.supplier.create({ data: parsed.data });
  res.status(201).json(supplier);
});

suppliersRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const parsed = supplierSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(supplier);
});
