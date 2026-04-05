import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";

import "./globals.css";

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "文寄四海",
  description: "高校校际信件活动信息登记系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className={`${notoSansSC.variable} h-full`}>
      <body className="min-h-full bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
