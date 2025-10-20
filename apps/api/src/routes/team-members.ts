import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/async-handler.js';
import { badRequest } from '../errors.js';

const createMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  roleTitle: z.string().min(2),
  team: z.string().min(2),
  startDate: z.coerce.date().optional(),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const members = await prisma.teamMember.findMany({
      orderBy: [{ name: 'asc' }],
    });

    res.json({ members });
  }),
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const payload = createMemberSchema.parse(req.body);

    try {
      const member = await prisma.teamMember.create({
        data: {
          name: payload.name,
          email: payload.email.toLowerCase(),
          roleTitle: payload.roleTitle,
          team: payload.team,
          startDate: payload.startDate,
        },
      });

      res.status(201).json({ member });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw badRequest('A team member with this email already exists.');
      }
      throw error;
    }
  }),
);

export const teamMembersRouter = router;
