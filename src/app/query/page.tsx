import Link from "next/link";

import { QueryForm } from "@/components/student/QueryForm";

export default function QueryPage() {
  return (
    <main className="page-shell py-8 sm:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">查询我的编号</h1>
          <p className="mt-2 text-sm text-slate-500">查询结果仅展示必要摘要信息，避免暴露不必要隐私。</p>
        </div>
        <Link href="/" className="secondary-button">
          返回首页
        </Link>
      </div>

      <QueryForm />
    </main>
  );
}
