import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";
import { campusCreateSchema } from "@/lib/validators";
import { canAccessSchool, normalizeSchoolFilter, isSuperAdmin } from "@/lib/permissions";
import { LETTER_TYPE_OPTIONS } from "@/config/constants";

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const schoolCode = normalizeSchoolFilter(session);
  const { searchParams } = new URL(request.url);
  const filterSchool = searchParams.get("schoolCode");

  let schoolFilter: { code: string } | undefined;
  if (isSuperAdmin(session)) {
    schoolFilter = filterSchool ? { code: filterSchool } : undefined;
  } else {
    schoolFilter = schoolCode ? { code: schoolCode } : undefined;
  }

  if (!isSuperAdmin(session) && !schoolFilter) {
    return ok([]);
  }

  const campuses = await prisma.campus.findMany({
    where: schoolFilter ? { school: schoolFilter } : {},
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
    orderBy: [{ schoolId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  return ok(campuses);
}

export async function POST(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const payload = await request.json();
  const parsed = campusCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail("校区数据不正确", 400, { errors: parsed.error.flatten() });
  }

  if (!canAccessSchool(session, parsed.data.schoolCode)) {
    return fail("无权为其他学校新增校区", 403);
  }

  const school = await prisma.school.findUnique({
    where: { code: parsed.data.schoolCode },
  });

  if (!school || !school.isActive || school.deletedAt) {
    return fail("学校不存在或已归档", 400);
  }

  const existingCode = await prisma.campus.findUnique({
    where: {
      schoolId_code: { schoolId: school.id, code: parsed.data.code },
    },
  });
  if (existingCode) {
    return fail("该校下校区代码已存在", 400);
  }

  const existingName = await prisma.campus.findFirst({
    where: { schoolId: school.id, name: parsed.data.name, deletedAt: null },
  });
  if (existingName) {
    return fail("该校下校区名称已存在", 400);
  }

  const campus = await prisma.$transaction(async (tx) => {
    const created = await tx.campus.create({
      data: {
        schoolId: school.id,
        code: parsed.data.code.toUpperCase(),
        name: parsed.data.name.trim(),
        hasBooth: parsed.data.hasBooth,
        sortOrder: parsed.data.sortOrder ?? 0,
        isEnabled: true,
      },
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

    if (parsed.data.hasBooth) {
      const letterTypes = await tx.letterType.findMany({
        where: {
          isActive: true,
          code: { in: LETTER_TYPE_OPTIONS.map((item) => item.code) },
        },
      });
      for (const letterType of letterTypes) {
        const exists = await tx.counterScope.findFirst({
          where: { campusId: created.id, letterTypeId: letterType.id },
        });
        if (!exists) {
          await tx.counterScope.create({
            data: {
              campusId: created.id,
              letterTypeId: letterType.id,
              currentValue: 0,
            },
          });
        }
      }
    }

    return created;
  });

  revalidateTag("bootstrap-data", "max");
  return ok(campus, "校区创建成功");
}
