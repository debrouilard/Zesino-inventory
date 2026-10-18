# Zesino Inventory

React + Node.js inventory operations workspace. The Reports page matches the current design reference; remaining sidebar pages are routed placeholders ready for later screenshots.

## Stack

- **Client:** React, Vite, TypeScript, Tailwind, React Router
- **Server:** Express, Prisma, SQLite (swap `DATABASE_URL` for PostgreSQL later if needed)
- **Auth:** JWT (`amara@zesino.com` / `Password123!` after seed)

## Run locally

```bash
cd Zesino-inventory
npm install
npm install --prefix server
npm install --prefix client
npm run db:seed --prefix server
npm run dev
```

- API: http://localhost:4000
- App: http://localhost:5173

`db:seed` runs `prisma db push` if you prefer:

```bash
cd server
npx prisma db push
npx prisma db seed
```

## API surface used by Reports

- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/reports/overview?weekOffset=0`
- `GET /api/reports/export?weekOffset=0`
- `GET /api/customers` (ready for the Customer page)
