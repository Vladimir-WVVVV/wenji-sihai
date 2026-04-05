import Link from "next/link";

type Props = {
  searchParams: Promise<{ code?: string; school?: string; type?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code || "未生成编号";

  return (
    <main className="page-shell py-10">
      <div className="mx-auto max-w-2xl card p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-3xl text-emerald-600">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-semibold text-slate-950">提交成功</h1>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          请立即截图保存编号，并在线下将该编号写在信封上，便于工作人员后续核验和分发。
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-500">你的唯一编号</p>
          <p className="mt-3 break-all text-2xl font-semibold text-slate-950 sm:text-3xl">
            {code}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/query" className="primary-button min-w-40">
            查询我的编号
          </Link>
          <Link href="/" className="secondary-button min-w-40">
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}
