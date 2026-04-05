import { SubmissionStatus } from "@prisma/client";

import { AdminRecordsFilters } from "@/components/admin/AdminRecordsFilters";
import { AdminRecordsTable } from "@/components/admin/AdminRecordsTable";
import { requireAdminSession } from "@/lib/auth";
import {
  STATUS_CODE_TO_NAME,
} from "@/config/constants";
import { getAdminRecords } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminRecordsPage({ searchParams }: Props) {
  const session = await requireAdminSession();
  const params = await searchParams;

  const schoolCode = typeof params.schoolCode === "string" ? params.schoolCode : undefined;
  const boothId = typeof params.boothId === "string" ? Number(params.boothId) : undefined;
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

  const [records, schools, booths] = await Promise.all([
    getAdminRecords(session, {
      schoolCode,
      boothId,
      letterTypeCode,
      status,
      senderName,
      studentId,
      displayCode,
      createdFrom: createdFrom ? new Date(createdFrom) : undefined,
      createdTo: createdTo ? new Date(`${createdTo}T23:59:59.999`) : undefined,
      sort,
    }),
    prisma.school.findMany({
      where: isSuperAdmin(session) ? undefined : { code: session.schoolCode || undefined },
      orderBy: { id: "asc" },
    }),
    prisma.booth.findMany({
      where: isSuperAdmin(session) ? undefined : { school: { code: session.schoolCode || undefined } },
      orderBy: [{ schoolId: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        school: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const initialRecords = records.map((record) => ({
    id: record.id,
    displayCode: record.displayCode,
    schoolName: record.school.name,
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
          支持学校、摊位、信件类型、状态、寄件人姓名、学号和编号筛选，并可导出 CSV。
        </p>
      </div>

      <AdminRecordsFilters
        schools={schools}
        booths={booths}
        isSuperAdmin={isSuperAdmin(session)}
        initialFilters={{
          schoolCode: schoolCode || "",
          boothId: boothId ? String(boothId) : "",
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
