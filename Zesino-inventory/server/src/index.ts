import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { productsRouter } from './routes/products.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { suppliersRouter } from './routes/suppliers.routes.js';
import { purchasesRouter, importBatchesRouter } from './routes/purchases.routes.js';
import { salesRouter } from './routes/sales.routes.js';
import { inventoryRouter } from './routes/inventory.routes.js';
import { usersRouter } from './routes/users.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { settingsRouter } from './routes/settings.routes.js';
import { customersRouter } from './routes/customers.routes.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchases', purchasesRouter);
app.use('/api/import-batches', importBatchesRouter);
app.use('/api/sales', salesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/settings', settingsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
  });
}

export { app };
