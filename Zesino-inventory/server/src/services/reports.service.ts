import { prisma } from '../lib/prisma.js';
import { Decimal, toDisplayMoney } from '../lib/decimal.js';
import { eachDay, formatDayKey, getWeekRange } from '../lib/dates.js';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function sumMoney(values: Array<string | number | Decimal | null | undefined>) {
  return values.reduce((sum, value) => sum.plus(new Decimal(value ?? 0)), new Decimal(0));
}

export async function getReportsOverview(weekOffset = 0) {
  const { from, to } = getWeekRange(new Date(), weekOffset);
  const previous = getWeekRange(new Date(), weekOffset - 1);

  const [weekSales, previousSales, livePosCount, products, recentLiveSales] = await Promise.all([
    prisma.sale.findMany({
      where: { soldAt: { gte: from, lte: to } },
      select: { totalAmount: true, soldAt: true, source: true },
    }),
    prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { soldAt: { gte: previous.from, lte: previous.to } },
    }),
    prisma.sale.count({
      where: { source: 'POS', soldAt: { gte: from, lte: to } },
    }),
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        sku: true,
        quantityOnHand: true,
        lowStockThreshold: true,
        costPrice: true,
      },
      orderBy: { quantityOnHand: 'asc' },
    }),
    prisma.sale.findMany({
      where: { source: 'POS', soldAt: { gte: from, lte: to } },
      include: {
        product: { select: { name: true, sku: true } },
        customer: { select: { name: true } },
      },
      orderBy: { soldAt: 'desc' },
      take: 25,
    }),
  ]);

  const weeklySales = sumMoney(weekSales.map((sale) => sale.totalAmount.toString()));
  const lastWeekSales = new Decimal(previousSales._sum.totalAmount?.toString() ?? '0');
  const vsLastWeek =
    lastWeekSales.isZero()
      ? weeklySales.isZero()
        ? 0
        : 100
      : weeklySales.minus(lastWeekSales).div(lastWeekSales).times(100).toNumber();

  const totalsByDay = new Map<string, Decimal>();
  for (const sale of weekSales) {
    const key = formatDayKey(sale.soldAt);
    totalsByDay.set(key, (totalsByDay.get(key) ?? new Decimal(0)).plus(sale.totalAmount.toString()));
  }

  const dailySales = eachDay(from, to).map((day, index) => {
    const total = totalsByDay.get(formatDayKey(day)) ?? new Decimal(0);
    return {
      date: formatDayKey(day),
      label: WEEKDAY_LABELS[index],
      total: toDisplayMoney(total),
      totalNumber: Number(total.toFixed(2)),
    };
  });

  const stockValue = products.reduce(
    (sum, product) => sum.plus(new Decimal(product.costPrice.toString()).times(product.quantityOnHand)),
    new Decimal(0),
  );

  const lowStock = products.filter((product) => product.quantityOnHand <= product.lowStockThreshold);
  const inStock = products.filter((product) => product.quantityOnHand > 0);
  const maxQty = Math.max(160, ...products.map((product) => product.quantityOnHand), 1);

  return {
    period: {
      from: from.toISOString(),
      to: to.toISOString(),
      label: formatPeriodLabel(from, to),
      weekOffset,
    },
    kpis: {
      weeklySales: toDisplayMoney(weeklySales),
      weeklySalesNumber: Number(weeklySales.toFixed(2)),
      livePosCount,
      productsInStock: products.length,
      distinctAvailable: inStock.length,
      lowStockCount: lowStock.length,
      stockValue: toDisplayMoney(stockValue),
      stockValueNumber: Number(stockValue.toFixed(2)),
    },
    salesPerformance: {
      vsLastWeekPercent: Number(vsLastWeek.toFixed(1)),
      daily: dailySales,
    },
    stockHealth: products.slice(0, 8).map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      quantity: product.quantityOnHand,
      threshold: product.lowStockThreshold,
      depleted: product.quantityOnHand === 0,
      fillPercent: Math.min(100, (product.quantityOnHand / maxQty) * 100),
    })),
    recentSales: recentLiveSales.map((sale) => ({
      id: sale.id,
      transactionNumber: sale.transactionNumber,
      customer: sale.customer?.name ?? sale.customerName ?? 'Walk-in',
      itemsSold: `${sale.quantity} × ${sale.product.name}`,
      recordedAt: sale.soldAt.toISOString(),
      total: toDisplayMoney(sale.totalAmount.toString()),
    })),
  };
}

function formatPeriodLabel(from: Date, to: Date) {
  const sameMonth = from.getMonth() === to.getMonth();
  const fromDay = from.getDate();
  const toDay = to.getDate();
  const month = from.toLocaleString('en-GB', { month: 'long' });
  const endMonth = to.toLocaleString('en-GB', { month: 'long' });
  const year = to.getFullYear();
  if (sameMonth) return `${fromDay}–${toDay} ${month} ${year}`;
  return `${fromDay} ${month} – ${toDay} ${endMonth} ${year}`;
}

export function overviewToCsv(overview: Awaited<ReturnType<typeof getReportsOverview>>) {
  const lines = [
    'Zesino Reports export',
    `Period,${overview.period.label}`,
    '',
    'KPI,Value',
    `Weekly sales,${overview.kpis.weeklySales}`,
    `Live POS transactions,${overview.kpis.livePosCount}`,
    `Products in stock,${overview.kpis.productsInStock}`,
    `Low stock items,${overview.kpis.lowStockCount}`,
    `Stock value,${overview.kpis.stockValue}`,
    '',
    'Day,Sales',
    ...overview.salesPerformance.daily.map((day) => `${day.label},${day.total}`),
    '',
    'Product,SKU,Units',
    ...overview.stockHealth.map((item) => `${item.name},${item.sku},${item.quantity}`),
  ];
  return lines.join('\n');
}
