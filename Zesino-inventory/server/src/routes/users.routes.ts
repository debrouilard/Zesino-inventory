import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const usersRouter = Router();
usersRouter.use(requireAuth, requireRole('ADMIN'));

usersRouter.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

usersRouter.post('/', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    role: z.nativeEnum(UserRole),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: { ...parsed.data, passwordHash },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  res.status(201).json(user);
});

usersRouter.patch('/:id', async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    role: z.nativeEnum(UserRole).optional(),
    active: z.boolean().optional(),
    password: z.string().min(8).optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data: Record<string, unknown> = { ...parsed.data };
  delete data.password;
  if (parsed.data.password) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data,
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  res.json(user);
});
