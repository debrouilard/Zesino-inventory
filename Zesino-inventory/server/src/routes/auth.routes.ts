import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, signToken } from '../middleware/auth.js';
import { writeAudit } from '../middleware/audit.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });

  const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const tokenUser = { id: user.id, email: user.email, role: user.role };
  await writeAudit('LOGIN', 'User', user.id, user.id);

  res.json({
    token: signToken(tokenUser),
    user: { id: user.id, email: user.email, name: user.name, role: user.role, jobTitle: user.jobTitle },
  });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, role: true, jobTitle: true },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});
