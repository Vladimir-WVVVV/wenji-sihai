"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";

export function QuestionnaireQrCard() {
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(`${window.location.origin}/apply`);
  }, []);

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-900">二维码入口</h3>
      <p className="text-sm text-slate-500">线下活动可直接打印此二维码供学生扫码填写。</p>
      {url ? (
        <>
          <QRCodeSVG value={url} size={180} level="M" />
          <p className="text-xs text-slate-400">{url}</p>
        </>
      ) : (
        <div className="flex h-[180px] w-[180px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
          正在生成二维码
        </div>
      )}
    </div>
  );
}
