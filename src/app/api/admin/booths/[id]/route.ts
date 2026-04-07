import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

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

  if (!booth.school.isActive || booth.school.deletedAt) {
    return fail("所属学校已停用或已删除，无法继续修改摊位", 400);
  }

  if (booth.deletedAt) {
    return fail("该摊位已删除归档，不能再次编辑或启用", 400);
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

  revalidateTag("bootstrap-data", "max");
  return ok(updated, "摊位更新成功");
}

export async function DELETE(request: NextRequest, context: Context) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { id } = await context.params;
  const booth = await prisma.booth.findUnique({
    where: { id: Number(id) },
    include: {
      school: true,
      _count: {
        select: {
          submissions: true,
        },
      },
    },
  });

  if (!booth) {
    return fail("摊位不存在", 404);
  }

  if (!canAccessSchool(session, booth.school.code)) {
    return fail("无权删除其他学校摊位", 403);
  }

  if (booth.deletedAt) {
    return fail("该摊位已删除归档", 400);
  }

  if (booth._count.submissions > 0) {
    const archived = await prisma.booth.update({
      where: { id: booth.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
      include: { school: true },
    });

    revalidateTag("bootstrap-data", "max");
    return ok(
      {
        mode: "archived",
        booth: archived,
      },
      "该摊位已有关联历史记录，已归档并从问卷及筛选选项中移除",
    );
  }

  await prisma.booth.delete({
    where: { id: booth.id },
  });

  revalidateTag("bootstrap-data", "max");
  return ok(
    {
      mode: "deleted",
      id: booth.id,
    },
    "摊位已删除",
  );
}
