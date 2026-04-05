import Link from "next/link";

import { SubmissionForm } from "@/components/student/SubmissionForm";
import { getBootstrapData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ApplyPage() {
  try {
    const { schools } = await getBootstrapData();

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

        <SubmissionForm schools={schools} />
      </main>
    );
  } catch {
    return (
      <main className="page-shell py-8 sm:py-10">
        <div className="card max-w-2xl p-6">
          <h1 className="text-2xl font-semibold text-slate-950">填写活动信息</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            当前暂时无法加载学校与摊位数据，请稍后重试。
          </p>
          <div className="mt-5">
            <Link href="/" className="secondary-button">
              返回首页
            </Link>
          </div>
        </div>
      </main>
    );
  }
}
