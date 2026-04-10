import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { campusUpdateSchema } from "@/lib/validators";
import { canAccessSchool, isSuperAdmin } from "@/lib/permissions";
import { LETTER_TYPE_OPTIONS } from "@/config/constants";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { id } = await context.params;
  const campus = await prisma.campus.findUnique({
    where: { id: Number(id) },
    include: {
      school: true,
      booths: {
        where: { deletedAt: null, isActive: true },
      },
    },
  });

  if (!campus) {
    return fail("校区不存在", 404);
  }

  if (!canAccessSchool(session, campus.school.code)) {
    return fail("无权修改其他学校校区", 403);
  }

  if (campus.deletedAt) {
    return fail("校区已归档，无法编辑", 400);
  }

  const payload = await request.json();
  const parsed = campusUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("校区数据不正确", 400, { errors: parsed.error.flatten() });
  }

  if (parsed.data.hasBooth === false && campus.booths.length > 0) {
    return fail("请先删除或归档该校区下的启用中摊位，再将校区改为非摆点", 400);
  }

  if (parsed.data.name !== undefined) {
    const nextName = parsed.data.name.trim();
    const clash = await prisma.campus.findFirst({
      where: {
        schoolId: campus.schoolId,
        name: nextName,
        deletedAt: null,
        NOT: { id: campus.id },
      },
    });
    if (clash) {
      return fail("该校下校区名称已存在", 400);
    }
  }

  const nextHasBooth = parsed.data.hasBooth ?? campus.hasBooth;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.campus.update({
      where: { id: campus.id },
      data: {
        ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
        hasBooth: nextHasBooth,
        sortOrder: parsed.data.sortOrder ?? campus.sortOrder,
        isEnabled: parsed.data.isEnabled ?? campus.isEnabled,
      },
    });

    if (nextHasBooth) {
      const letterTypes = await tx.letterType.findMany({
        where: {
          isActive: true,
          code: { in: LETTER_TYPE_OPTIONS.map((item) => item.code) },
        },
      });
      for (const letterType of letterTypes) {
        const exists = await tx.counterScope.findFirst({
          where: { campusId: campus.id, letterTypeId: letterType.id },
        });
        if (!exists) {
          await tx.counterScope.create({
            data: {
              campusId: campus.id,
              letterTypeId: letterType.id,
              currentValue: 0,
            },
          });
        }
      }
    }

    if (!nextHasBooth && campus.hasBooth) {
      await tx.counterScope.deleteMany({ where: { campusId: campus.id } });
    }

    return tx.campus.findUniqueOrThrow({
      where: { id: row.id },
      include: {
        school: { select: { code: true, name: true } },
        _count: {
          select: {
            booths: true,
            activitySubmissions: true,
            recipientSubmissions: true,
          },
        },
      },
    });
  });

  revalidateTag("bootstrap-data", "max");
  return ok(updated, "校区已更新");
}

export async function DELETE(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  if (!isSuperAdmin(session)) {
    return fail("归档/删除校区仅限超级管理员，以防误操作影响多校数据；本校摊位仍可由高校管理员管理", 403);
  }

  const { id } = await context.params;
  const campus = await prisma.campus.findUnique({
    where: { id: Number(id) },
    include: {
      school: true,
      _count: {
        select: {
          activitySubmissions: true,
          recipientSubmissions: true,
          booths: true,
        },
      },
    },
  });

  if (!campus) {
    return fail("校区不存在", 404);
  }

  if (campus.deletedAt) {
    return fail("校区已归档", 400);
  }

  const now = new Date();
  const hasHistory =
    campus._count.activitySubmissions > 0 || campus._count.recipientSubmissions > 0;

  if (hasHistory) {
    await prisma.$transaction(async (tx) => {
      await tx.booth.updateMany({
        where: { campusId: campus.id, deletedAt: null },
        data: { isActive: false, deletedAt: now },
      });
      await tx.campus.update({
        where: { id: campus.id },
        data: { isEnabled: false, deletedAt: now, hasBooth: false },
      });
      await tx.counterScope.deleteMany({ where: { campusId: campus.id } });
    });

    revalidateTag("bootstrap-data", "max");
    return ok({ mode: "archived", id: campus.id }, "校区已有关联记录，已归档并从问卷中移除");
  }

  await prisma.$transaction(async (tx) => {
    await tx.booth.deleteMany({ where: { campusId: campus.id } });
    await tx.counterScope.deleteMany({ where: { campusId: campus.id } });
    await tx.campus.delete({ where: { id: campus.id } });
  });

  revalidateTag("bootstrap-data", "max");
  return ok({ mode: "deleted", id: campus.id }, "校区已删除");
}
