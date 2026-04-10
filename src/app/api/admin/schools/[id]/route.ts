import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { countSubmissionsInvolvingSchool } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { isSuperAdmin } from "@/lib/permissions";

type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  if (!isSuperAdmin(session)) {
    return fail("仅超级管理员可管理学校", 403);
  }

  const { id } = await context.params;
  const school = await prisma.school.findUnique({
    where: { id: Number(id) },
    include: {
      _count: {
        select: {
          campuses: true,
        },
      },
    },
  });

  if (!school) {
    return fail("学校不存在", 404);
  }

  if (school.deletedAt) {
    return fail("该学校已删除归档", 400);
  }

  const submissionInvolveCount = await countSubmissionsInvolvingSchool(school.id);

  if (submissionInvolveCount > 0) {
    const deletedAt = new Date();
    const archived = await prisma.$transaction(async (tx) => {
      await tx.booth.updateMany({
        where: {
          deletedAt: null,
          OR: [{ campus: { schoolId: school.id } }, { schoolId: school.id }],
        },
        data: {
          isActive: false,
          deletedAt,
        },
      });

      await tx.campus.updateMany({
        where: { schoolId: school.id, deletedAt: null },
        data: {
          isEnabled: false,
          deletedAt,
          hasBooth: false,
        },
      });

      await tx.counterScope.deleteMany({
        where: {
          OR: [{ campus: { schoolId: school.id } }, { schoolId: school.id }],
        },
      });

      return tx.school.update({
        where: { id: school.id },
        data: {
          isActive: false,
          deletedAt,
        },
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
          deletedAt: true,
        },
      });
    });

    revalidateTag("bootstrap-data", "max");
    return ok(
      {
        mode: "archived",
        school: {
          ...archived,
          _count: {
            campuses: school._count.campuses,
            submissions: submissionInvolveCount,
          },
        },
      },
      "该学校已有历史业务数据，已归档并从问卷与筛选项中移除；关联校区与摊位已同步归档",
    );
  }

  await prisma.school.delete({
    where: { id: school.id },
  });

  revalidateTag("bootstrap-data", "max");
  return ok(
    {
      mode: "deleted",
      id: school.id,
    },
    "学校已删除",
  );
}
