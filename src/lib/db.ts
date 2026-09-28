import { PrismaClient } from "@prisma/client";

// DATABASE_URL connects as the "prisma_migration" role, which has a low
// connection allowance meant for occasional schema migrations, not
// concurrent app traffic — under real staff load it was fully exhausted
// ("too many connections for role prisma_migration"), crashing every
// route. STORAGE_DATABASE_URL (auto-provisioned by Vercel alongside
// DATABASE_URL) is a separate, better-provisioned connection meant for
// runtime queries. Falls back to DATABASE_URL locally, where that var
// isn't set.
function datasourceUrl() {
  return process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

globalForPrisma.prisma = prisma;
