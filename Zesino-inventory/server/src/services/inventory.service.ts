import { Prisma, PurchaseType, StockMovementType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { Decimal, money, toMoneyString } from '../lib/decimal.js';
import { nextTransactionNumber } from '../lib/ids.js';

export class InventoryError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

export async function applyStockMovement(
  tx: Tx,
  params: {
    productId: string;
    movementType: StockMovementType;
    quantityDelta: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdById: string;
  },
) {
  const product = await tx.product.findUnique({ where: { id: params.productId } });
  if (!product) throw new InventoryError('Product not found', 404);

  const newBalance = product.quantityOnHand + params.quantityDelta;
  if (newBalance < 0) {
    throw new InventoryError(
      `Insufficient stock for ${product.name}. Available: ${product.quantityOnHand}, requested: ${Math.abs(params.quantityDelta)}`,
    );
  }

  await tx.product.update({
    where: { id: params.productId },
    data: { quantityOnHand: newBalance },
  });

  await tx.stockMovement.create({
    data: {
      productId: params.productId,
      movementType: params.movementType,
      quantityDelta: params.quantityDelta,
      balanceAfter: newBalance,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      notes: params.notes,
      createdById: params.createdById,
    },
  });

  return newBalance;
}

export function computePurchaseTotals(
  quantity: number,
  unitCost: string | number,
  taxRate: string | number,
  customsDuty = '0',
) {
  const qty = money(quantity);
  const unit = money(unitCost);
  const subtotal = unit.times(qty);
  const duty = money(customsDuty);
  const taxable = subtotal.plus(duty);
  const tax = taxable.times(money(taxRate));
  const total = taxable.plus(tax);
  return {
    subtotal: toMoneyString(subtotal),
    taxAmount: toMoneyString(tax),
    totalAmount: toMoneyString(total),
  };
}

export function computeSaleTotals(quantity: number, unitPrice: string | number, taxRate: string | number) {
  const qty = money(quantity);
  const unit = money(unitPrice);
  const subtotal = unit.times(qty);
  const tax = subtotal.times(money(taxRate));
  const total = subtotal.plus(tax);
  return {
    subtotal: toMoneyString(subtotal),
    taxAmount: toMoneyString(tax),
    totalAmount: toMoneyString(total),
  };
}

export async function getDefaultTaxRate(): Promise<Decimal> {
  const setting = await prisma.appSetting.findUnique({ where: { key: 'default_tax_rate' } });
  if (setting) return money(setting.value);
  const envRate = process.env.DEFAULT_TAX_RATE ?? '0.15';
  return money(envRate);
}

export async function recordPurchase(input: {
  purchaseType: PurchaseType;
  productId: string;
  supplierId: string;
  importBatchId?: string;
  quantity: number;
  unitCost: string;
  taxRate?: string;
  customsDuty?: string;
  reference?: string;
  createdById: string;
}) {
  if (input.quantity <= 0) throw new InventoryError('Quantity must be positive');

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new InventoryError('Product not found', 404);

  if (input.purchaseType === PurchaseType.IMPORT && product.origin !== 'IMPORTED') {
    throw new InventoryError('Import purchases can only be recorded for imported products');
  }
  if (input.purchaseType === PurchaseType.LOCAL && product.origin !== 'LOCAL') {
    throw new InventoryError('Local purchases can only be recorded for locally sourced products');
  }
  if (input.purchaseType === PurchaseType.IMPORT && !input.importBatchId) {
    throw new InventoryError('Import batch is required for import purchases');
  }

  const taxRate = input.taxRate ?? (await getDefaultTaxRate()).toString();
  const totals = computePurchaseTotals(
    input.quantity,
    input.unitCost,
    taxRate,
    input.purchaseType === PurchaseType.IMPORT ? (input.customsDuty ?? '0') : '0',
  );

  return prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        purchaseType: input.purchaseType,
        productId: input.productId,
        supplierId: input.supplierId,
        importBatchId: input.importBatchId,
        quantity: input.quantity,
        unitCost: input.unitCost,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        reference: input.reference,
        createdById: input.createdById,
      },
      include: { product: true, supplier: true, importBatch: true },
    });

    await applyStockMovement(tx, {
      productId: input.productId,
      movementType: StockMovementType.PURCHASE_RECEIPT,
      quantityDelta: input.quantity,
      referenceType: 'Purchase',
      referenceId: purchase.id,
      createdById: input.createdById,
    });

    const avgCost = money(product.costPrice)
      .times(product.quantityOnHand)
      .plus(money(input.unitCost).times(input.quantity))
      .dividedBy(product.quantityOnHand + input.quantity);

    await tx.product.update({
      where: { id: input.productId },
      data: { costPrice: toMoneyString(avgCost) },
    });

    return purchase;
  });
}

export async function recordSale(input: {
  productId: string;
  quantity: number;
  unitPrice?: string;
  customerName?: string;
  customerId?: string;
  source?: 'POS' | 'MANUAL' | 'SYNC';
  createdById: string;
}) {
  if (input.quantity <= 0) throw new InventoryError('Quantity must be positive');

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new InventoryError('Product not found', 404);
  if (product.quantityOnHand < input.quantity) {
    throw new InventoryError(`Insufficient stock. Available: ${product.quantityOnHand}`);
  }

  const unitPrice = input.unitPrice ?? product.unitPrice.toString();
  const taxRate = (await getDefaultTaxRate()).toString();
  const totals = computeSaleTotals(input.quantity, unitPrice, taxRate);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        transactionNumber: nextTransactionNumber(),
        source: input.source ?? 'POS',
        productId: input.productId,
        quantity: input.quantity,
        unitPrice,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        customerName: input.customerName,
        customerId: input.customerId,
        createdById: input.createdById,
      },
      include: { product: true },
    });

    await applyStockMovement(tx, {
      productId: input.productId,
      movementType: StockMovementType.SALE,
      quantityDelta: -input.quantity,
      referenceType: 'Sale',
      referenceId: sale.id,
      createdById: input.createdById,
    });

    return sale;
  });
}
