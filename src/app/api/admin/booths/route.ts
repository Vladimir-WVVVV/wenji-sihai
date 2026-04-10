import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getBoothsForAdmin } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { boothSchema } from "@/lib/validators";
import { canAccessSchool } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const booths = await getBoothsForAdmin(session);
  return ok(booths);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const payload = await request.json();
  const parsed = boothSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("摊位数据不正确", 400, { errors: parsed.error.flatten() });
  }

  const campus = await prisma.campus.findUnique({
    where: { id: parsed.data.campusId },
    include: { school: true },
  });

  if (!campus) {
    return fail("校区不存在", 404);
  }

  if (!canAccessSchool(session, campus.school.code)) {
    return fail("无权操作其他学校摊位", 403);
  }

  if (!campus.hasBooth) {
    return fail("仅能在摆点校区下新增摊位", 400);
  }

  if (!campus.isEnabled || campus.deletedAt) {
    return fail("校区已停用或已归档，无法新增摊位", 400);
  }

  if (!campus.school.isActive || campus.school.deletedAt) {
    return fail("所属学校已停用或已删除，无法新增摊位", 400);
  }

  const booth = await prisma.booth.create({
    data: {
      campusId: campus.id,
      schoolId: campus.schoolId,
      name: parsed.data.name,
      isActive: parsed.data.isActive ?? true,
    },
    include: {
      campus: {
        include: {
          school: true,
        },
      },
    },
  });

  revalidateTag("bootstrap-data", "max");
  return ok(booth, "摊位创建成功");
}
