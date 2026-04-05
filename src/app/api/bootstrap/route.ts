import { ok } from "@/lib/response";
import { getBootstrapData } from "@/lib/db";
import { getPrismaRuntimeInfo } from "@/lib/prisma";

export async function GET() {
  try {
    const data = await getBootstrapData();
    return ok(data);
  } catch (error) {
    console.error("[api/bootstrap] failed", {
      db: getPrismaRuntimeInfo(),
      error,
    });
    throw error;
  }
}
