import Link from "next/link";

import { QuestionnaireQrCard } from "@/components/student/QuestionnaireQrCard";

export default function HomePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL &&
    !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://wenji-sihai.vercel.app";
  const applyUrl = `${siteUrl.replace(/\/$/, "")}/apply`;

  return (
    <main className="page-shell py-10 sm:py-14">
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-6 sm:p-8">
          <p className="text-sm font-medium tracking-[0.2em] text-slate-500 uppercase">
            文寄四海
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            高校校际信件活动信息登记系统
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            面向学生参与者与工作人员的轻量化活动系统。学生可扫码填写寄信信息并即时获得唯一编号；
            工作人员可登录后台查看本校记录、筛选导出数据、维护摊位并更新流转状态。
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/apply" className="primary-button min-w-36">
              去填写
            </Link>
            <Link href="/query" className="secondary-button min-w-36">
              查询编号
            </Link>
            <Link href="/admin/login" className="secondary-button min-w-36">
              工作人员登录
            </Link>
          </div>

          <div className="mt-8 grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="font-medium text-slate-900">移动端优先</div>
              <p className="mt-2 leading-6">扫码即可填写，适合线下摊位活动快速登记。</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="font-medium text-slate-900">多校独立编号</div>
              <p className="mt-2 leading-6">按“学校 + 信件类型”独立流水编号，避免冲突。</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="font-medium text-slate-900">后台共享查看</div>
              <p className="mt-2 leading-6">工作人员在浏览器内查看和管理数据，无需命令行。</p>
            </div>
          </div>
        </div>

        <QuestionnaireQrCard url={applyUrl} />
      </section>
    </main>
  );
}
