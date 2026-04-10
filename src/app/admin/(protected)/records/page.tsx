import { SubmissionStatus } from "@prisma/client";

import { AdminRecordsFilters } from "@/components/admin/AdminRecordsFilters";
import { AdminRecordsTable } from "@/components/admin/AdminRecordsTable";
import { requireAdminSession } from "@/lib/auth";
import { STATUS_CODE_TO_NAME } from "@/config/constants";
import { getAdminRecords } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const activeSchoolFilter = {
  isActive: true,
  deletedAt: null,
} as const;

export default async function AdminRecordsPage({ searchParams }: Props) {
  const session = await requireAdminSession();
  const params = await searchParams;

  const schoolCode = typeof params.schoolCode === "string" ? params.schoolCode : undefined;
  const boothId = typeof params.boothId === "string" ? Number(params.boothId) : undefined;
  const activityCampusId =
    typeof params.activityCampusId === "string" ? Number(params.activityCampusId) : undefined;
  const recipientCampusId =
    typeof params.recipientCampusId === "string" ? Number(params.recipientCampusId) : undefined;
  const letterTypeCode =
    typeof params.letterTypeCode === "string" ? params.letterTypeCode : undefined;
  const status =
    typeof params.status === "string" ? (params.status as SubmissionStatus) : undefined;
  const senderName = typeof params.senderName === "string" ? params.senderName : undefined;
  const studentId = typeof params.studentId === "string" ? params.studentId : undefined;
  const displayCode = typeof params.displayCode === "string" ? params.displayCode : undefined;
  const createdFrom =
    typeof params.createdFrom === "string" ? params.createdFrom : undefined;
  const createdTo = typeof params.createdTo === "string" ? params.createdTo : undefined;
  const sort = params.sort === "asc" ? "asc" : "desc";

  const records = await getAdminRecords(session, {
    schoolCode,
    boothId,
    activityCampusId,
    recipientCampusId,
    letterTypeCode,
    status,
    senderName,
    studentId,
    displayCode,
    createdFrom: createdFrom ? new Date(createdFrom) : undefined,
    createdTo: createdTo ? new Date(`${createdTo}T23:59:59.999`) : undefined,
    sort,
  });

  const schools = await prisma.school.findMany({
    where: isSuperAdmin(session)
      ? { isActive: true, deletedAt: null }
      : { code: session.schoolCode || undefined, isActive: true, deletedAt: null },
    orderBy: { id: "asc" },
  });

  const schoolScope = isSuperAdmin(session)
    ? { school: activeSchoolFilter }
    : { school: { code: session.schoolCode || "__none__", ...activeSchoolFilter } };

  const activityCampusRows = await prisma.campus.findMany({
    where: {
      hasBooth: true,
      deletedAt: null,
      isEnabled: true,
      ...schoolScope,
    },
    include: { school: { select: { code: true, name: true } } },
    orderBy: [{ schoolId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  const recipientCampusRows = await prisma.campus.findMany({
    where: {
      deletedAt: null,
      isEnabled: true,
      ...schoolScope,
    },
    include: { school: { select: { code: true, name: true } } },
    orderBy: [{ schoolId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
  });

  const boothSchoolFilter = isSuperAdmin(session)
    ? activeSchoolFilter
    : {
        code: session.schoolCode || undefined,
        ...activeSchoolFilter,
      };

  const booths = await prisma.booth.findMany({
    where: {
      isActive: true,
      deletedAt: null,
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

  const activityCampuses = activityCampusRows.map((c) => ({
    id: c.id,
    schoolCode: c.school.code,
    label: `${c.school.name}（${c.name}）`,
  }));

  const recipientCampuses = recipientCampusRows.map((c) => ({
    id: c.id,
    schoolCode: c.school.code,
    label: `${c.school.name}（${c.name}）`,
  }));

  const boothOptions = booths.map((b) => ({
    id: b.id,
    name: b.name,
    school: b.campus?.school ?? b.school ?? { code: "", name: "—" },
  }));

  const initialRecords = records.map((record) => ({
    id: record.id,
    displayCode: record.displayCode,
    rawCode: record.rawCode,
    activitySchoolName: record.school.name,
    activityCampusLabel: record.activityCampus
      ? `${record.activityCampus.school.name}（${record.activityCampus.name}）`
      : "—（历史记录）",
    recipientSchoolName:
      record.letterType.code === "BDX" ? "—" : (record.recipientSchool?.name ?? "—"),
    recipientCampusName:
      record.letterType.code === "BDX"
        ? "—"
        : (record.recipientCampus?.name ?? "—（历史记录）"),
    boothName: record.booth.name,
    senderName: record.senderName,
    studentId: record.studentId,
    phone: record.phone,
    letterTypeName: record.letterType.name,
    statusName: STATUS_CODE_TO_NAME[record.status],
    createdAtLabel: formatDateTime(record.createdAt),
  }));

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">记录列表</h1>
        <p className="mt-2 text-sm text-slate-500">
          <strong>方案 B</strong>：高校管理员可见「活动登记在本校」或「收信学校为本校」的记录（与列表筛选、导出、详情一致）。展示编号与内部短码分列，编号计数仍仅按活动摆点校区 + 信件类型。
        </p>
      </div>

      <AdminRecordsFilters
        schools={schools}
        booths={boothOptions}
        activityCampuses={activityCampuses}
        recipientCampuses={recipientCampuses}
        isSuperAdmin={isSuperAdmin(session)}
        initialFilters={{
          schoolCode: schoolCode || "",
          boothId: boothId ? String(boothId) : "",
          activityCampusId: activityCampusId ? String(activityCampusId) : "",
          recipientCampusId: recipientCampusId ? String(recipientCampusId) : "",
          letterTypeCode: letterTypeCode || "",
          status: status || "",
          senderName: senderName || "",
          studentId: studentId || "",
          displayCode: displayCode || "",
          createdFrom: createdFrom || "",
          createdTo: createdTo || "",
          sort,
        }}
      />

      <AdminRecordsTable initialRecords={initialRecords} />
    </div>
  );
}
