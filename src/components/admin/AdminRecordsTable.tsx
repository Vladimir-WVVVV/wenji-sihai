"use client";

import Link from "next/link";
import { useState } from "react";

import { AdminDeleteSubmissionButton } from "@/components/admin/AdminDeleteSubmissionButton";

type RecordRow = {
  id: number;
  displayCode: string;
  rawCode: string;
  activitySchoolName: string;
  activityCampusLabel: string;
  recipientSchoolName: string;
  recipientCampusName: string;
  boothName: string;
  senderName: string;
  studentId: string;
  phone: string;
  letterTypeName: string;
  statusName: string;
  createdAtLabel: string;
};

type Props = {
  initialRecords: RecordRow[];
};

export function AdminRecordsTable({ initialRecords }: Props) {
  const [records, setRecords] = useState(initialRecords);

  function handleDeleted(id: number) {
    setRecords((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">展示编号</th>
              <th className="px-4 py-3">内部短码</th>
              <th className="px-4 py-3">活动学校</th>
              <th className="px-4 py-3">活动校区</th>
              <th className="px-4 py-3">收信学校</th>
              <th className="px-4 py-3">收信校区</th>
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
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{record.rawCode}</td>
                <td className="px-4 py-3">{record.activitySchoolName}</td>
                <td className="px-4 py-3">{record.activityCampusLabel}</td>
                <td className="px-4 py-3">{record.recipientSchoolName}</td>
                <td className="px-4 py-3">{record.recipientCampusName}</td>
                <td className="px-4 py-3">{record.boothName}</td>
                <td className="px-4 py-3">{record.senderName}</td>
                <td className="px-4 py-3">{record.studentId}</td>
                <td className="px-4 py-3">{record.phone}</td>
                <td className="px-4 py-3">{record.letterTypeName}</td>
                <td className="px-4 py-3">{record.statusName}</td>
                <td className="px-4 py-3">{record.createdAtLabel}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/admin/records/${record.id}`} className="secondary-button">
                      查看详情
                    </Link>
                    <AdminDeleteSubmissionButton
                      submissionId={record.id}
                      onDeleted={handleDeleted}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {records.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={14}>
                  当前筛选条件下暂无记录。
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
