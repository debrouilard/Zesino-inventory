import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { InventoryError, recordSale } from '../services/inventory.service.js';
import { writeAudit } from '../middleware/audit.js';

export const salesRouter = Router();
salesRouter.use(requireAuth);

salesRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      include: { product: true, createdBy: { select: { name: true } } },
      orderBy: { soldAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count(),
  ]);

  res.json({ items, total, page, limit });
});

salesRouter.post('/', requireRole('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const schema = z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.string().or(z.number()).optional(),
    customerName: z.string().optional(),
    customerId: z.string().optional(),
    source: z.enum(['POS', 'MANUAL', 'SYNC']).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const sale = await recordSale({
      productId: parsed.data.productId,
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice !== undefined ? String(parsed.data.unitPrice) : undefined,
      customerName: parsed.data.customerName,
      customerId: parsed.data.customerId,
      source: parsed.data.source,
      createdById: req.user!.id,
    });
    await writeAudit('STOCK_CHANGE', 'Sale', sale.id, req.user!.id);
    res.status(201).json(sale);
  } catch (e) {
    if (e instanceof InventoryError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
});
