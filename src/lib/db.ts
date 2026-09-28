import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Route queries through Prisma Postgres's built-in connection pooler
// (STORAGE_PRISMA_DATABASE_URL, auto-provisioned by Vercel) instead of a raw
// direct connection — under concurrent load, many serverless instances
// sharing one direct Postgres connection limit was causing
// PrismaClientInitializationError for anyone whose request couldn't get a
// connection. Falls back to DATABASE_URL locally, where that var isn't set.
function createClient() {
  return new PrismaClient({
    datasourceUrl: process.env.STORAGE_PRISMA_DATABASE_URL || process.env.DATABASE_URL,
  }).$extends(withAccelerate());
}

type ExtendedClient = ReturnType<typeof createClient>;

// Cache the client on the global object in every environment, not just dev,
// so a warm serverless container reuses one pooled connection instead of
// opening a fresh one per invocation.
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

const client = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = client;

// Cast back to the plain PrismaClient type for every call site — Accelerate
// only changes connection routing under the hood, not the query API shape,
// and the extended type otherwise breaks inference in a lot of call sites.
export const prisma = client as unknown as PrismaClient;
