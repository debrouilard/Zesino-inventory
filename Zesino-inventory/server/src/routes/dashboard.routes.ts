import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { Decimal, toDisplayMoney } from '../lib/decimal.js';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get('/stats', async (_req, res) => {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [productCount, products, salesAgg, purchasesAgg, recentMovements, recentSales] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
    }),
    prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { soldAt: { gte: monthStart } } }),
    prisma.purchase.aggregate({ _sum: { totalAmount: true }, where: { receivedAt: { gte: monthStart } } }),
    prisma.stockMovement.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { product: true, createdBy: { select: { name: true } } },
    }),
    prisma.sale.findMany({
      where: { soldAt: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } },
      select: { soldAt: true, totalAmount: true },
    }),
  ]);

  const lowStock = products.filter((p) => p.quantityOnHand <= p.lowStockThreshold).slice(0, 10);

  const totalInventoryValue = products.reduce(
    (sum, p) => sum.plus(new Decimal(p.costPrice.toString()).times(p.quantityOnHand)),
    new Decimal(0),
  );

  const monthMap = new Map<string, Decimal>();
  for (const sale of recentSales) {
    const key = sale.soldAt.toLocaleString('en-US', { month: 'short' });
    monthMap.set(key, (monthMap.get(key) ?? new Decimal(0)).plus(sale.totalAmount.toString()));
  }

  res.json({
    kpis: {
      totalProducts: productCount,
      lowStockCount: lowStock.length,
      monthlySales: toDisplayMoney(salesAgg._sum.totalAmount?.toString() ?? '0'),
      monthlyPurchases: toDisplayMoney(purchasesAgg._sum.totalAmount?.toString() ?? '0'),
      inventoryValue: toDisplayMoney(totalInventoryValue),
    },
    lowStock,
    recentMovements,
    salesTrend: [...monthMap.entries()].map(([month, total]) => ({
      month,
      revenue: toDisplayMoney(total),
    })),
  });
});
