import Link from "next/link";

import { ApplyFormShell } from "@/components/student/ApplyFormShell";

export default function ApplyPage() {
  return (
    <main className="page-shell py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">填写活动信息</h1>
          <p className="mt-2 text-sm text-slate-500">
            请按照页面顺序填写，提交成功后将立即生成唯一信件编号。
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
