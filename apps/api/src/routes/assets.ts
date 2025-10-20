import { Router } from 'express';
import { AssetType } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { asyncHandler } from '../utils/async-handler.js';

const listQuerySchema = z.object({
  type: z.nativeEnum(AssetType).optional(),
});

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listQuerySchema.parse(req.query);

    const assets = await prisma.dataAsset.findMany({
      where: query.type
        ? {
            type: query.type,
          }
        : undefined,
      include: {
        initiative: {
          select: {
            id: true,
            name: true,
            stage: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ assets });
  }),
);

export const assetsRouter = router;
