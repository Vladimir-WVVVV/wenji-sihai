import Link from "next/link";
import { SubmissionStatus } from "@prisma/client";

import { AdminRecordsFilters } from "@/components/admin/AdminRecordsFilters";
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

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">编号</th>
                <th className="px-4 py-3">学校</th>
                <th className="px-4 py-3">摊位</th>
                <th className="px-4 py-3">寄件人姓名</th>
                <th className="px-4 py-3">学号</th>
                <th className="px-4 py-3">联系方式</th>
                <th className="px-4 py-3">信件类型</th>
                <th className="px-4 py-3">当前状态</th>
                <th className="px-4 py-3">提交时间</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{record.displayCode}</td>
                  <td className="px-4 py-3">{record.school.name}</td>
                  <td className="px-4 py-3">{record.booth.name}</td>
                  <td className="px-4 py-3">{record.senderName}</td>
                  <td className="px-4 py-3">{record.studentId}</td>
                  <td className="px-4 py-3">{record.phone}</td>
                  <td className="px-4 py-3">{record.letterType.name}</td>
                  <td className="px-4 py-3">{STATUS_CODE_TO_NAME[record.status]}</td>
                  <td className="px-4 py-3">{formatDateTime(record.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/records/${record.id}`} className="secondary-button">
                      查看详情
                    </Link>
                  </td>
                </tr>
              ))}
              {records.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan={10}>
                    当前筛选条件下暂无记录。
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
