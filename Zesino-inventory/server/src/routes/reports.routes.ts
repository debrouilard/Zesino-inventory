import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { toDisplayMoney } from '../lib/decimal.js';
import { getReportsOverview, overviewToCsv } from '../services/reports.service.js';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get('/overview', async (req, res) => {
  const weekOffset = Number(req.query.weekOffset ?? 0);
  const overview = await getReportsOverview(Number.isFinite(weekOffset) ? weekOffset : 0);
  res.json(overview);
});

reportsRouter.get('/export', async (req, res) => {
  const weekOffset = Number(req.query.weekOffset ?? 0);
  const overview = await getReportsOverview(Number.isFinite(weekOffset) ? weekOffset : 0);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="zesino-report-${overview.period.from.slice(0, 10)}.csv"`,
  );
  res.send(overviewToCsv(overview));
});

reportsRouter.get('/summary', async (req, res) => {
  const from = req.query.from ? new Date(String(req.query.from)) : new Date(Date.now() - 30 * 86400000);
  const to = req.query.to ? new Date(String(req.query.to)) : new Date();

  const [sales, purchases, topProducts, auditLogs] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { totalAmount: true, quantity: true },
      _count: true,
      where: { soldAt: { gte: from, lte: to } },
    }),
    prisma.purchase.groupBy({
      by: ['purchaseType'],
      _sum: { totalAmount: true, quantity: true },
      where: { receivedAt: { gte: from, lte: to } },
    }),
    prisma.sale.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalAmount: true },
      where: { soldAt: { gte: from, lte: to } },
      orderBy: { _sum: { totalAmount: 'desc' } },
      take: 5,
    }),
    prisma.auditLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  res.json({
    period: { from, to },
    sales: {
      count: sales._count,
      quantity: sales._sum.quantity ?? 0,
      revenue: toDisplayMoney(sales._sum.totalAmount?.toString() ?? '0'),
    },
    purchasesByType: purchases.map((p) => ({
      type: p.purchaseType,
      quantity: p._sum.quantity ?? 0,
      total: toDisplayMoney(p._sum.totalAmount?.toString() ?? '0'),
    })),
    topProducts: topProducts.map((p) => ({
      product: productMap[p.productId],
      quantity: p._sum.quantity ?? 0,
      revenue: toDisplayMoney(p._sum.totalAmount?.toString() ?? '0'),
    })),
    auditLogs,
  });
});
