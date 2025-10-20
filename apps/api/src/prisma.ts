import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  transactionOptions: {
    timeout: 10000, // 10 seconds timeout for transactions
  },
});
