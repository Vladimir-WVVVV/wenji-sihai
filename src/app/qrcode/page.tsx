import Link from "next/link";

import { QuestionnaireQrCard } from "@/components/student/QuestionnaireQrCard";

export default function QrcodePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL &&
    !process.env.NEXT_PUBLIC_SITE_URL.includes("localhost")
      ? process.env.NEXT_PUBLIC_SITE_URL
      : "https://wenji-sihai.vercel.app";
  const applyUrl = `${siteUrl.replace(/\/$/, "")}/apply`;

  return (
    <main className="page-shell py-10">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-slate-950">问卷二维码</h1>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            线下活动时可直接打开此页投屏或打印，学生扫码后会进入填写页面。
          </p>
        </div>
        <QuestionnaireQrCard url={applyUrl} />
        <div className="flex justify-center">
          <Link href="/apply" className="secondary-button">
            直接进入填写页
          </Link>
        </div>
      </div>
    </main>
  );
}
