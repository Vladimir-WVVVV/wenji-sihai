import { BoothManager } from "@/components/admin/BoothManager";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminBoothsPage() {
  const session = await requireAdminSession();

  const [schools, booths] = await Promise.all([
    prisma.school.findMany({
      where: isSuperAdmin(session) ? undefined : { code: session.schoolCode || undefined },
      orderBy: { id: "asc" },
      select: {
        code: true,
        name: true,
      },
    }),
    prisma.booth.findMany({
      where: isSuperAdmin(session) ? undefined : { school: { code: session.schoolCode || undefined } },
      orderBy: [{ schoolId: "asc" }, { id: "asc" }],
      include: {
        school: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">摊位管理</h1>
        <p className="mt-2 text-sm text-slate-500">
          普通高校管理员只能管理自己学校的摊位；测试用超级管理员可查看全部学校。
        </p>
      </div>

      <BoothManager
        schools={schools}
        booths={booths}
        defaultSchoolCode={session.schoolCode}
        isSuperAdmin={isSuperAdmin(session)}
      />
    </div>
  );
}
