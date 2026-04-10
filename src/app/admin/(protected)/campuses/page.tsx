import { CampusManager } from "@/components/admin/CampusManager";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminCampusesPage() {
  const session = await requireAdminSession();
  const superAdmin = isSuperAdmin(session);

  const schools = await prisma.school.findMany({
    where: superAdmin
      ? { isActive: true, deletedAt: null }
      : {
          code: session.schoolCode || undefined,
          isActive: true,
          deletedAt: null,
        },
    orderBy: { id: "asc" },
    select: {
      code: true,
      name: true,
    },
  });

  const campuses = await prisma.campus.findMany({
    where: superAdmin
      ? {}
      : { school: { code: session.schoolCode || undefined } },
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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-xl font-semibold text-slate-950 sm:text-2xl">校区管理</h1>
        <p className="mt-2 text-sm text-slate-500">
          区分<strong>摆点校区</strong>与仅收信校区。高校管理员可新增/调整本校校区及摆点属性；<strong>归档或删除校区</strong>仅限超级管理员，以免误删影响多校数据。
        </p>
      </div>

      <CampusManager
        schools={schools}
        campuses={campuses}
        defaultSchoolCode={session.schoolCode}
        isSuperAdmin={superAdmin}
      />
    </div>
  );
}
