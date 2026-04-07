import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { isSuperAdmin } from "@/lib/permissions";
import { schoolSchema } from "@/lib/validators";
import { LETTER_TYPE_OPTIONS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  if (!isSuperAdmin(session)) {
    return fail("仅超级管理员可管理学校", 403);
  }

  const schools = await prisma.school.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      deletedAt: true,
      _count: {
        select: {
          booths: true,
          submissions: true,
          counterScopes: true,
        },
      },
    },
  });

  return ok(schools);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  if (!isSuperAdmin(session)) {
    return fail("仅超级管理员可管理学校", 403);
  }

  const payload = await request.json();
  const parsed = schoolSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("学校数据不正确", 400, { errors: parsed.error.flatten() });
  }

  const existingCode = await prisma.school.findUnique({
    where: { code: parsed.data.code },
    select: { id: true },
  });
  if (existingCode) {
    return fail("学校代码已存在", 400);
  }

  const existingName = await prisma.school.findUnique({
    where: { name: parsed.data.name },
    select: { id: true },
  });
  if (existingName) {
    return fail("学校名称已存在", 400);
  }

  const school = await prisma.$transaction(async (tx) => {
    const created = await tx.school.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        isActive: true,
      },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        deletedAt: true,
      },
    });

    const letterTypes = await tx.letterType.findMany({
      where: {
        isActive: true,
        code: {
          in: LETTER_TYPE_OPTIONS.map((item) => item.code),
        },
      },
      select: {
        id: true,
      },
    });

    for (const letterType of letterTypes) {
      await tx.counterScope.create({
        data: {
          schoolId: created.id,
          letterTypeId: letterType.id,
          currentValue: 0,
        },
      });
    }

    return created;
  });

  revalidateTag("bootstrap-data", "max");
  return ok(
    {
      ...school,
      _count: {
        booths: 0,
        submissions: 0,
        counterScopes: LETTER_TYPE_OPTIONS.length,
      },
    },
    "学校创建成功",
  );
}
