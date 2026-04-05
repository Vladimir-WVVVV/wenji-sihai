import { NextRequest } from "next/server";

import { getAdminDashboardStats } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const stats = await getAdminDashboardStats(session);
  return ok(stats);
}
