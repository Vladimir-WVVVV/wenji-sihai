import { redirect } from "next/navigation";

import { SchoolManager } from "@/components/admin/SchoolManager";
import { requireAdminSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminSchoolsPage() {
  const session = await requireAdminSession();

  if (!isSuperAdmin(session)) {
    redirect("/admin");
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

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">学校管理</h1>
        <p className="mt-2 text-sm text-slate-500">
          仅超级管理员可操作。无历史数据的学校可直接删除；已有历史数据的学校会归档并从问卷和筛选项中移除。
        </p>
      </div>

      <SchoolManager schools={schools} />
    </div>
  );
}
