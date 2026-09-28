import { PrismaClient } from "@prisma/client";

// DATABASE_URL connects as the "prisma_migration" role, which has a low
// connection allowance meant for occasional schema migrations, not
// concurrent app traffic — under real staff load it was fully exhausted
// ("too many connections for role prisma_migration"), crashing every
// route. STORAGE_DATABASE_URL (auto-provisioned by Vercel alongside
// DATABASE_URL) is a separate, better-provisioned connection meant for
// runtime queries. Falls back to DATABASE_URL locally, where that var
// isn't set.
//
// Even on the right role, Vercel can run many concurrent serverless
// instances under real load, and each one builds its own PrismaClient with
// its own connection pool — Prisma's default pool size per client (based on
// CPU count) is generous enough that a burst of concurrent instances can
// still exhaust the role's total connection budget. Capping each instance
// to a handful of connections keeps total usage bounded regardless of how
// many instances spin up.
function datasourceUrl() {
  const base = process.env.STORAGE_DATABASE_URL || process.env.DATABASE_URL;
  if (!base) return base;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}connection_limit=3&pool_timeout=10`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: datasourceUrl() });

globalForPrisma.prisma = prisma;
