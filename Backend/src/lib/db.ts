import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client
// En développement, Next.js recharge les modules à chaud (HMR).
// Sans ce pattern, chaque rechargement crée une nouvelle connexion
// et épuise rapidement le pool de connexions PostgreSQL.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
