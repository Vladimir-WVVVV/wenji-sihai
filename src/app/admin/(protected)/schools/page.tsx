import { redirect } from "next/navigation";

import { SchoolManager } from "@/components/admin/SchoolManager";
import { requireAdminSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { countSubmissionsInvolvingSchool } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const session = await requireAdminSession();

  if (!isSuperAdmin(session)) {
    redirect("/admin");
  }

  const schoolRows = await prisma.school.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      isActive: true,
      deletedAt: true,
      _count: {
        select: {
          campuses: true,
        },
      },
    },
  });

  const schools = await Promise.all(
    schoolRows.map(async (s) => ({
      ...s,
      _count: {
        campuses: s._count.campuses,
        submissions: await countSubmissionsInvolvingSchool(s.id),
      },
    })),
  );

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">学校管理</h1>
        <p className="mt-2 text-sm text-slate-500">
          仅超级管理员可操作。历史记录数含「活动登记在本校」或「收信学校为本校」的提交。无关联记录的学校可直接删除；否则归档。
        </p>
      </div>

      <SchoolManager schools={schools} />
    </div>
  );
}
