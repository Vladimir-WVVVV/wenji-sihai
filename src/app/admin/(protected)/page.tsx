import Link from "next/link";

import { getAdminDashboardStats } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const stats = await getAdminDashboardStats(session);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">后台首页</h1>
        <p className="mt-2 text-sm text-slate-500">
          当前查看范围：{stats.school?.name || "全部学校"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["本校总提交数", stats.total],
          ["本校定向寄信数", stats.directed],
          ["本校不定向寄信数", stats.random],
          ["本校中小学生回信数", stats.reply],
          ["今日新增数量", stats.today],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">快速操作</h2>
          <p className="mt-2 text-sm text-slate-500">前往记录页筛选、导出和处理当前学校信件。</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/admin/records" className="primary-button">
            打开记录列表
          </Link>
          <Link href="/admin/booths" className="secondary-button">
            维护摊位
          </Link>
        </div>
      </div>
    </div>
  );
}
