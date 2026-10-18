import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get('/', async (_req, res) => {
  const settings = await prisma.appSetting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  res.json({
    defaultTaxRate: map.default_tax_rate ?? process.env.DEFAULT_TAX_RATE ?? '0.15',
    companyName: map.company_name ?? 'Zesino Enterprise',
  });
});

settingsRouter.put('/', requireRole('ADMIN'), async (req, res) => {
  const schema = z.object({
    defaultTaxRate: z.string().optional(),
    companyName: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.defaultTaxRate) {
    await prisma.appSetting.upsert({
      where: { key: 'default_tax_rate' },
      create: { key: 'default_tax_rate', value: parsed.data.defaultTaxRate },
      update: { value: parsed.data.defaultTaxRate },
    });
  }
  if (parsed.data.companyName) {
    await prisma.appSetting.upsert({
      where: { key: 'company_name' },
      create: { key: 'company_name', value: parsed.data.companyName },
      update: { value: parsed.data.companyName },
    });
  }

  res.json({ ok: true });
});
