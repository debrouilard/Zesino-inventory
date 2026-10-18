import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAY_MS = 86_400_000;

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekStart(reference = new Date(), weekOffset = 0) {
  const base = startOfDay(reference);
  const day = base.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(base.getTime() + (mondayOffset + weekOffset * 7) * DAY_MS);
}

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.importBatch.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.appSetting.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const amara = await prisma.user.create({
    data: {
      email: 'amara@zesino.com',
      passwordHash,
      name: 'Amara Okoye',
      jobTitle: 'Operations Admin',
      role: 'ADMIN',
    },
  });

  await prisma.appSetting.createMany({
    data: [
      { key: 'default_tax_rate', value: '0.15' },
      { key: 'company_name', value: 'Zesino' },
    ],
  });

  const hardware = await prisma.category.create({
    data: { name: 'POS Hardware', description: 'Terminals, printers, and scanners' },
  });
  const fixtures = await prisma.category.create({
    data: { name: 'Store fixtures', description: 'Display and counter equipment' },
  });
  const consumables = await prisma.category.create({
    data: { name: 'Consumables', description: 'Paper and day-to-day supplies' },
  });

  const supplier = await prisma.supplier.create({
    data: {
      name: 'Northbridge Hardware',
      email: 'orders@northbridge.example',
      country: 'China',
      isLocal: false,
    },
  });

  const [terminal, printer, paper, stand, scanner] = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'SKU-44021',
        name: 'POS Terminal X4',
        origin: 'IMPORTED',
        categoryId: hardware.id,
        primarySupplierId: supplier.id,
        quantityOnHand: 0,
        lowStockThreshold: 5,
        unitPrice: '1299.00',
        costPrice: '850.00',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SKU-11802',
        name: 'Industrial Label Printer',
        origin: 'IMPORTED',
        categoryId: hardware.id,
        primarySupplierId: supplier.id,
        quantityOnHand: 18,
        lowStockThreshold: 25,
        unitPrice: '620.00',
        costPrice: '420.00',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SKU-22087',
        name: 'Thermal Receipt Paper (80mm)',
        origin: 'LOCAL',
        categoryId: consumables.id,
        quantityOnHand: 24,
        lowStockThreshold: 30,
        unitPrice: '18.00',
        costPrice: '12.50',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SKU-33019',
        name: 'Countertop Display Stand',
        origin: 'LOCAL',
        categoryId: fixtures.id,
        quantityOnHand: 73,
        lowStockThreshold: 20,
        unitPrice: '140.00',
        costPrice: '85.00',
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SKU-11452',
        name: 'Wireless Barcode Scanner',
        origin: 'IMPORTED',
        categoryId: hardware.id,
        primarySupplierId: supplier.id,
        quantityOnHand: 148,
        lowStockThreshold: 20,
        unitPrice: '189.00',
        costPrice: '107.90',
      },
    }),
  ]);

  await prisma.customer.createMany({
    data: [
      { name: 'Harbor Retail Group', email: 'accounts@harbor.example', company: 'Harbor Retail' },
      { name: 'Kofi Mensah', email: 'kofi@example.com' },
    ],
  });

  const thisWeek = getWeekStart(new Date(), 0);
  const lastWeek = getWeekStart(new Date(), -1);
  const thisWeekTotals = [18000, 22000, 21000, 25590, 26000, 26000, 33000];
  const lastWeekTotals = [16200, 19800, 19100, 23200, 23400, 23500, 29944.67];
  const catalog = [terminal, printer, paper, stand, scanner];

  async function seedWeek(weekStart: Date, totals: number[], prefix: string, source: 'SYNC' | 'POS') {
    for (let i = 0; i < totals.length; i += 1) {
      const soldAt = new Date(weekStart.getTime() + i * DAY_MS);
      soldAt.setHours(14, 30, 0, 0);
      const product = catalog[i % catalog.length];
      await prisma.sale.create({
        data: {
          transactionNumber: `${prefix}-${i + 1}`,
          source,
          productId: product.id,
          quantity: 1,
          unitPrice: totals[i].toFixed(2),
          taxAmount: '0',
          totalAmount: totals[i].toFixed(2),
          customerName: 'Synced wholesale',
          soldAt,
          createdById: amara.id,
        },
      });
    }
  }

  await seedWeek(lastWeek, lastWeekTotals, 'SYNC-LW', 'SYNC');
  await seedWeek(thisWeek, thisWeekTotals, 'SYNC-TW', 'SYNC');

  console.log('Seeded Zesino demo data. Login: amara@zesino.com / Password123!');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
