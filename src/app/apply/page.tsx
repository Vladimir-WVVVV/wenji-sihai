import Link from "next/link";

import { ApplyFormShell } from "@/components/student/ApplyFormShell";

export default function ApplyPage() {
  return (
    <main className="page-shell py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">填写活动信息</h1>
          <p className="mt-2 text-sm text-slate-500">
            请按顺序选择<strong>活动摆点校区</strong>、摊位与<strong>收信去向校区</strong>；提交成功后将按活动校区与信件类型生成唯一编号。
          </p>
        </div>
        <Link href="/" className="secondary-button">
          返回首页
        </Link>
      </div>

      <ApplyFormShell />
    </main>
  );
}
