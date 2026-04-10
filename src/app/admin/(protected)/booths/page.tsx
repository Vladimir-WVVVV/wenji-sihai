import Link from "next/link";



import { BoothManager } from "@/components/admin/BoothManager";

import { prisma } from "@/lib/prisma";

import { requireAdminSession } from "@/lib/auth";

import { isSuperAdmin } from "@/lib/permissions";



export const dynamic = "force-dynamic";



export default async function AdminBoothsPage() {

  const session = await requireAdminSession();

  const superAdmin = isSuperAdmin(session);



  const managedSchool =

    !superAdmin && session.schoolCode

      ? await prisma.school.findUnique({

          where: { code: session.schoolCode },

          select: {

            name: true,

            isActive: true,

            deletedAt: true,

          },

        })

      : null;



  if (!superAdmin && managedSchool && (!managedSchool.isActive || managedSchool.deletedAt)) {

    return (

      <div className="space-y-6">

        <div className="card p-6">

          <h1 className="text-2xl font-semibold text-slate-950">摊位管理</h1>

          <p className="mt-2 text-sm text-slate-500">

            {managedSchool.name} 已归档，当前账号仅保留历史记录查看能力，不能再新增、修改或删除摊位。

          </p>

        </div>



        <div className="card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-lg font-semibold text-slate-950">可继续查看历史记录</h2>

            <p className="mt-2 text-sm text-slate-500">

              若需核对既有提交，请前往记录列表和详情页；如需恢复学校使用，请由超级管理员处理。

            </p>

          </div>

          <Link href="/admin/records" className="secondary-button">

            打开记录列表

          </Link>

        </div>

      </div>

    );

  }



  const schools = await prisma.school.findMany({

    where: superAdmin

      ? { isActive: true, deletedAt: null }

      : { code: session.schoolCode || undefined, isActive: true, deletedAt: null },

    orderBy: { id: "asc" },

    select: {

      code: true,

      name: true,

    },

  });



  const boothSchoolFilter = superAdmin

    ? { isActive: true, deletedAt: null }

    : {

        code: session.schoolCode || undefined,

        isActive: true,

        deletedAt: null,

      };



  const boothCampuses = await prisma.campus.findMany({

    where: {

      hasBooth: true,

      isEnabled: true,

      deletedAt: null,

      school: boothSchoolFilter,

    },

    orderBy: [{ schoolId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],

    select: {

      id: true,

      name: true,

      school: { select: { code: true, name: true } },

    },

  });



  const booths = await prisma.booth.findMany({

    where: {

      OR: [

        { campus: { school: boothSchoolFilter } },

        { schoolId: { not: null }, school: boothSchoolFilter },

      ],

    },

    orderBy: [{ id: "asc" }],

    include: {

      campus: {

        include: {

          school: { select: { code: true, name: true } },

        },

      },

      school: { select: { code: true, name: true } },

    },

  });



  return (

    <div className="space-y-6">

      <div className="card p-6">

        <h1 className="text-2xl font-semibold text-slate-950">摊位管理</h1>

        <p className="mt-2 text-sm text-slate-500">

          新建摊位须挂在<strong>摆点校区</strong>下；历史摊位可能仅有学校维度，列表中会提示补全校区。

        </p>

      </div>



      <BoothManager

        schools={schools}

        boothCampuses={boothCampuses}

        booths={booths}

        defaultSchoolCode={session.schoolCode}

        isSuperAdmin={superAdmin}

      />

    </div>

  );

}

