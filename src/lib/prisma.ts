import { PrismaClient } from "@prisma/client";

type PrismaRuntimeInfo = {
  host: string;
  port: string;
  hasPgbouncer: boolean;
};

const FALLBACK_RUNTIME_INFO: PrismaRuntimeInfo = {
  host: "unknown",
  port: "unknown",
  hasPgbouncer: false,
};

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaRuntimeInfoLogged?: boolean;
};

export function getPrismaRuntimeInfo(): PrismaRuntimeInfo {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return FALLBACK_RUNTIME_INFO;
  }

  try {
    const parsed = new URL(databaseUrl);
    return {
      host: parsed.hostname || "unknown",
      port: parsed.port || "5432",
      hasPgbouncer: parsed.searchParams.get("pgbouncer") === "true",
    };
  } catch {
    return FALLBACK_RUNTIME_INFO;
  }
}

function createPrismaClient() {
  const runtimeInfo = getPrismaRuntimeInfo();

  if (process.env.NODE_ENV === "development" && !globalForPrisma.prismaRuntimeInfoLogged) {
    console.info(
      `[prisma] runtime DATABASE_URL host=${runtimeInfo.host} port=${runtimeInfo.port} pgbouncer=${runtimeInfo.hasPgbouncer}`,
    );
    globalForPrisma.prismaRuntimeInfoLogged = true;
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: process.env.DATABASE_URL
      ? {
          db: {
            url: process.env.DATABASE_URL,
          },
        }
      : undefined,
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
