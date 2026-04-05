import { NextRequest } from "next/server";

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

  if (!canAccessSchool(session, parsed.data.schoolCode)) {
    return fail("无权操作其他学校摊位", 403);
  }

  const school = await prisma.school.findUnique({
    where: { code: parsed.data.schoolCode },
  });

  if (!school) {
    return fail("学校不存在", 404);
  }

  const booth = await prisma.booth.create({
    data: {
      schoolId: school.id,
      name: parsed.data.name,
      isActive: parsed.data.isActive ?? true,
    },
    include: {
      school: true,
    },
  });

  return ok(booth, "摊位创建成功");
}
