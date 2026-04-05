"use client";

import { QRCodeSVG } from "qrcode.react";

type Props = {
  url: string;
};

export function QuestionnaireQrCard({ url }: Props) {

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center">
      <h3 className="text-lg font-semibold text-slate-900">二维码入口</h3>
      <p className="text-sm text-slate-500">线下活动可直接打印此二维码供学生扫码填写。</p>
      <>
        <QRCodeSVG value={url} size={180} level="M" />
        <p className="text-xs text-slate-400 break-all">{url}</p>
      </>
    </div>
  );
}
