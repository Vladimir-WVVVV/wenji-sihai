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



function boothManagingSchoolCode(booth: {

  campus: { school: { code: string } } | null;

  school: { code: string } | null;

}) {

  return booth.campus?.school.code ?? booth.school?.code ?? null;

}



export async function PATCH(request: NextRequest, context: Context) {

  const session = await requireAdminApiSession(request);

  if (!session) {

    return fail("未登录或登录已过期", 401);

  }



  const { id } = await context.params;

  const booth = await prisma.booth.findUnique({

    where: { id: Number(id) },

    include: {

      campus: {

        include: { school: true },

      },

      school: true,

    },

  });



  if (!booth) {

    return fail("摊位不存在", 404);

  }



  const schoolCode = boothManagingSchoolCode(booth);

  if (!schoolCode || !canAccessSchool(session, schoolCode)) {

    return fail("无权操作其他学校摊位", 403);

  }



  const schoolRow = booth.campus?.school ?? booth.school;

  if (!schoolRow?.isActive || schoolRow.deletedAt) {

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



  let nextCampusId = booth.campusId;

  let nextSchoolId = booth.schoolId;



  if (parsed.data.campusId !== undefined) {

    const campus = await prisma.campus.findUnique({

      where: { id: parsed.data.campusId },

      include: { school: true },

    });

    if (!campus || !campus.hasBooth) {

      return fail("目标校区不存在或非摆点校区", 400);

    }

    if (!canAccessSchool(session, campus.school.code)) {

      return fail("无权将摊位挂到其他学校校区", 403);

    }

    if (!campus.isEnabled || campus.deletedAt || !campus.school.isActive || campus.school.deletedAt) {

      return fail("目标校区或学校不可用", 400);

    }

    nextCampusId = campus.id;

    nextSchoolId = campus.schoolId;

  }



  const updated = await prisma.booth.update({

    where: { id: booth.id },

    data: {

      name: parsed.data.name,

      isActive: parsed.data.isActive,

      ...(parsed.data.campusId !== undefined

        ? { campusId: nextCampusId, schoolId: nextSchoolId }

        : {}),

    },

    include: {

      campus: {

        include: { school: true },

      },

      school: true,

    },

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

      campus: {

        include: { school: true },

      },

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



  const delSchoolCode = boothManagingSchoolCode(booth);

  if (!delSchoolCode || !canAccessSchool(session, delSchoolCode)) {

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

      include: {

        campus: {

          include: { school: true },

        },

        school: true,

      },

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

