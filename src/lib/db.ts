import { PrismaClient } from "@prisma/client";

// Cache the client on the global object in every environment, not just dev.
// Without this, each warm serverless container would still reuse its own
// module instance fine on its own, but a naive re-check here costs nothing
// and protects against edge cases (e.g. Next.js module re-evaluation) that
// would otherwise open a fresh connection pool per invocation and exhaust
// the database's connection limit under concurrent load.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
