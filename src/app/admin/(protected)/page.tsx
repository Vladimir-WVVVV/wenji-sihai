import Link from "next/link";

import { getAdminDashboardStats } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const stats = await getAdminDashboardStats(session);
  const superAdmin = isSuperAdmin(session);

  const statRows = superAdmin
    ? [
        ["全库总提交数（定向+不定向，配置内类型）", stats.total],
        ["全库定向寄信数", stats.directed],
        ["全库不定向寄信数", stats.random],
        ["今日新增（全库）", stats.today],
      ]
    : [
        [
          "可见总提交数（活动本校 或 收信本校，方案 B）",
          stats.total,
        ],
        ["其中定向寄信", stats.directed],
        ["其中不定向寄信", stats.random],
        ["今日新增（同上范围）", stats.today],
      ];

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold text-slate-950">后台首页</h1>
        <p className="mt-2 text-sm text-slate-500">
          当前身份：{superAdmin ? "超级管理员" : "高校管理员"}；数据范围：
          {superAdmin
            ? "全部学校（统计为全库口径）"
            : stats.school?.name
              ? `「${stats.school.name}」——方案 B：活动登记在本校或收信学校为本校`
              : "未绑定学校"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statRows.map(([label, value]) => (
          <div key={String(label)} className="card p-5">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">快速操作</h2>
          <p className="mt-2 text-sm text-slate-500">前往记录页筛选、导出和处理信件。</p>
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
