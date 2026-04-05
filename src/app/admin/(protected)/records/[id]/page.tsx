import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminStatusForm } from "@/components/admin/AdminStatusForm";
import { getAdminRecordById } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { STATUS_CODE_TO_NAME } from "@/config/constants";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminRecordDetailPage({ params }: Props) {
  const session = await requireAdminSession();
  const { id } = await params;
  const record = await getAdminRecordById(session, Number(id));

  if (!record) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">记录详情</h1>
          <p className="mt-2 text-sm text-slate-500">{record.displayCode}</p>
        </div>
        <Link href="/admin/records" className="secondary-button">
          返回记录列表
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-950">基础信息</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>学校：{record.school.name}</div>
              <div>摊位：{record.booth.name}</div>
              <div>信件类型：{record.letterType.name}</div>
              <div>当前状态：{STATUS_CODE_TO_NAME[record.status]}</div>
              <div>展示编号：{record.displayCode}</div>
              <div>内部短码：{record.rawCode}</div>
              <div className="sm:col-span-2">创建时间：{formatDateTime(record.createdAt)}</div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-950">寄件人信息</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>寄件人姓名：{record.senderName}</div>
              <div>学号：{record.studentId}</div>
              <div>联系方式：{record.phone}</div>
              <div>学院 / 专业：{record.college || "未填写"}</div>
              <div>年级：{record.grade || "未填写"}</div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-semibold text-slate-950">收信人 / 主题信息</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>收信人姓名：{record.recipientName || "未填写"}</div>
              <div>收信人联系方式：{record.recipientPhone || "未填写"}</div>
              <div className="sm:col-span-2">收信地址：{record.recipientAddress || "未填写"}</div>
              <div>学校 / 年级：{record.recipientSchoolGrade || "未填写"}</div>
              <div>备注：{record.recipientRemark || "未填写"}</div>
              <div className="sm:col-span-2">
                主题 / 关键词：{record.freeLetterTopic || "未填写"}
              </div>
            </div>
          </section>
        </div>

        <aside className="card p-6">
          <AdminStatusForm submissionId={record.id} currentStatus={record.status} />
        </aside>
      </div>
    </div>
  );
}
