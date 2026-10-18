import { Router } from 'express';
import { PurchaseType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { InventoryError, recordPurchase } from '../services/inventory.service.js';
import { writeAudit } from '../middleware/audit.js';

export const purchasesRouter = Router();
purchasesRouter.use(requireAuth);

purchasesRouter.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const purchaseType = req.query.type as PurchaseType | undefined;

  const where = purchaseType ? { purchaseType } : {};

  const [items, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { product: true, supplier: true, importBatch: true, createdBy: { select: { name: true } } },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);

  res.json({ items, total, page, limit });
});

purchasesRouter.post('/', requireRole('ADMIN', 'MANAGER', 'STAFF'), async (req, res) => {
  const schema = z.object({
    purchaseType: z.nativeEnum(PurchaseType),
    productId: z.string(),
    supplierId: z.string(),
    importBatchId: z.string().optional(),
    quantity: z.number().int().positive(),
    unitCost: z.string().or(z.number()),
    taxRate: z.string().or(z.number()).optional(),
    customsDuty: z.string().or(z.number()).optional(),
    reference: z.string().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  try {
    const purchase = await recordPurchase({
      ...parsed.data,
      unitCost: String(parsed.data.unitCost),
      taxRate: parsed.data.taxRate !== undefined ? String(parsed.data.taxRate) : undefined,
      customsDuty: parsed.data.customsDuty !== undefined ? String(parsed.data.customsDuty) : undefined,
      createdById: req.user!.id,
    });
    await writeAudit('STOCK_CHANGE', 'Purchase', purchase.id, req.user!.id);
    res.status(201).json(purchase);
  } catch (e) {
    if (e instanceof InventoryError) return res.status(e.status).json({ error: e.message });
    throw e;
  }
});

export const importBatchesRouter = Router();
importBatchesRouter.use(requireAuth);

importBatchesRouter.get('/', async (_req, res) => {
  const batches = await prisma.importBatch.findMany({
    orderBy: { importDate: 'desc' },
    include: { supplier: true, _count: { select: { purchases: true } } },
  });
  res.json(batches);
});

importBatchesRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const schema = z.object({
    batchNumber: z.string().min(1),
    supplierId: z.string(),
    importDate: z.string().datetime().or(z.string()),
    customsDuty: z.string().or(z.number()).optional(),
    vatRate: z.string().or(z.number()).optional(),
    notes: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const batch = await prisma.importBatch.create({
    data: {
      batchNumber: parsed.data.batchNumber,
      supplierId: parsed.data.supplierId,
      importDate: new Date(parsed.data.importDate),
      customsDuty: String(parsed.data.customsDuty ?? 0),
      vatRate: String(parsed.data.vatRate ?? 0.15),
      notes: parsed.data.notes,
    },
    include: { supplier: true },
  });
  res.status(201).json(batch);
});
