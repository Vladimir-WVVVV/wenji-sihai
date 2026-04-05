import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { boothUpdateSchema } from "@/lib/validators";
import { canAccessSchool } from "@/lib/permissions";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { id } = await context.params;
  const booth = await prisma.booth.findUnique({
    where: { id: Number(id) },
    include: { school: true },
  });

  if (!booth) {
    return fail("摊位不存在", 404);
  }

  if (!canAccessSchool(session, booth.school.code)) {
    return fail("无权操作其他学校摊位", 403);
  }

  const payload = await request.json();
  const parsed = boothUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("摊位数据不正确", 400, { errors: parsed.error.flatten() });
  }

  const updated = await prisma.booth.update({
    where: { id: booth.id },
    data: {
      name: parsed.data.name,
      isActive: parsed.data.isActive,
    },
    include: { school: true },
  });

  return ok(updated, "摊位更新成功");
}
