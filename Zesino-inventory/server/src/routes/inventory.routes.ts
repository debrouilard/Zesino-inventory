import { Router } from 'express';
import { StockMovementType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { InventoryError, applyStockMovement } from '../services/inventory.service.js';

export const inventoryRouter = Router();
inventoryRouter.use(requireAuth);

inventoryRouter.get('/movements', async (req, res) => {
  const productId = req.query.productId as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));

  const where = productId ? { productId } : {};

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  res.json({ items, total, page, limit });
});

inventoryRouter.get('/low-stock', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true, relatedProduct: { select: { id: true, name: true, sku: true, quantityOnHand: true } } },
    orderBy: { quantityOnHand: 'asc' },
  });
  const lowStock = products.filter((p) => p.quantityOnHand <= p.lowStockThreshold);
  res.json(lowStock);
});

inventoryRouter.post('/adjust', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const schema = z.object({
    productId: z.string(),
    quantityDelta: z.number().int().refine((n) => n !== 0, 'Adjustment cannot be zero'),
    notes: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const movement = await prisma.$transaction(async (tx) => {
      const balance = await applyStockMovement(tx, {
        productId: parsed.data.productId,
        movementType: StockMovementType.ADJUSTMENT,
        quantityDelta: parsed.data.quantityDelta,
        notes: parsed.data.notes,
        createdById: req.user!.id,
      });
      return { balance };
    });
    res.json(movement);
  } catch (e) {
    if (e instanceof InventoryError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
});
