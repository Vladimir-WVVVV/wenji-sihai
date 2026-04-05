import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getAdminRecordById } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { updateStatusSchema } from "@/lib/validators";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { id } = await context.params;
  const record = await getAdminRecordById(session, Number(id));
  if (!record) {
    return fail("记录不存在或无权限查看", 404);
  }

  return ok(record);
}

export async function PATCH(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { id } = await context.params;
  const existed = await getAdminRecordById(session, Number(id));
  if (!existed) {
    return fail("记录不存在或无权限修改", 404);
  }

  const payload = await request.json();
  const parsed = updateStatusSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("状态值不正确");
  }

  const updated = await prisma.submission.update({
    where: { id: Number(id) },
    data: { status: parsed.data.status },
  });

  return ok(updated, "状态更新成功");
}
