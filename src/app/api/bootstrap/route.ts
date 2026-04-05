import { ok } from "@/lib/response";
import { getBootstrapData } from "@/lib/db";
import { getPrismaRuntimeInfo } from "@/lib/prisma";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getBootstrapData();
    return ok(data, "ok", {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[api/bootstrap] failed", {
      db: getPrismaRuntimeInfo(),
      error,
    });
    throw error;
  }
}
