import { Router } from 'express';
import { ProductOrigin } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeAudit } from '../middleware/audit.js';

export const productsRouter = Router();
productsRouter.use(requireAuth);

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  origin: z.nativeEnum(ProductOrigin),
  categoryId: z.string(),
  primarySupplierId: z.string().optional().nullable(),
  lowStockThreshold: z.number().int().min(0).optional(),
  unitPrice: z.string().or(z.number()),
  costPrice: z.string().or(z.number()).optional(),
  relatedProductId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

productsRouter.get('/', async (req, res) => {
  const search = String(req.query.search ?? '');
  const origin = req.query.origin as ProductOrigin | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const sort = String(req.query.sort ?? 'name');
  const order = req.query.order === 'desc' ? 'desc' : 'asc';

  const where = {
    AND: [
      search
        ? {
            OR: [
              { name: { contains: search } },
              { sku: { contains: search } },
            ],
          }
        : {},
      origin ? { origin } : {},
      categoryId ? { categoryId } : {},
    ],
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        primarySupplier: true,
        relatedProduct: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, limit });
});

productsRouter.get('/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      primarySupplier: true,
      relatedProduct: true,
      relatedFrom: { select: { id: true, name: true, sku: true, origin: true } },
      stockMovements: { take: 20, orderBy: { createdAt: 'desc' } },
      purchases: { take: 10, orderBy: { receivedAt: 'desc' }, include: { supplier: true, importBatch: true } },
    },
  });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

productsRouter.post('/', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.relatedProductId) {
    const related = await prisma.product.findUnique({ where: { id: parsed.data.relatedProductId } });
    if (!related) return res.status(400).json({ error: 'Related product not found' });
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      unitPrice: String(parsed.data.unitPrice),
      costPrice: String(parsed.data.costPrice ?? 0),
    },
    include: { category: true, primarySupplier: true },
  });

  await writeAudit('CREATE', 'Product', product.id, req.user!.id, { sku: product.sku });
  res.status(201).json(product);
});

productsRouter.put('/:id', requireRole('ADMIN', 'MANAGER'), async (req, res) => {
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...parsed.data,
      unitPrice: parsed.data.unitPrice !== undefined ? String(parsed.data.unitPrice) : undefined,
      costPrice: parsed.data.costPrice !== undefined ? String(parsed.data.costPrice) : undefined,
    },
    include: { category: true, primarySupplier: true, relatedProduct: true },
  });

  await writeAudit('UPDATE', 'Product', product.id, req.user!.id);
  res.json(product);
});

productsRouter.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  await writeAudit('DELETE', 'Product', req.params.id, req.user!.id);
  res.status(204).send();
});
