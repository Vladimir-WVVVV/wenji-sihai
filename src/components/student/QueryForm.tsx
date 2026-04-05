"use client";

import { useState } from "react";

import { QUERY_METHOD_OPTIONS, STATUS_CODE_TO_NAME } from "@/config/constants";
import { formatDateTime } from "@/lib/utils";

type QueryMode = "phone" | "studentId" | "namePhoneSuffix";

type QueryResult = {
  id: number;
  displayCode: string;
  schoolName: string;
  boothName: string;
  senderName: string;
  letterTypeName: string;
  status: keyof typeof STATUS_CODE_TO_NAME;
  createdAt: string;
};

export function QueryForm() {
  const [mode, setMode] = useState<QueryMode>("phone");
  const [phone, setPhone] = useState("");
  const [studentId, setStudentId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<QueryResult[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResults([]);

    const payload =
      mode === "phone"
        ? { mode, phone }
        : mode === "studentId"
          ? { mode, studentId }
          : { mode, senderName, phoneSuffix };

    const response = await fetch("/api/query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "查询失败");
      return;
    }

    setResults(result.data || []);
    if (!result.data?.length) {
      setMessage("未查询到符合条件的记录");
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="card space-y-5 p-5 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">查询我的编号</h1>
          <p className="mt-2 text-sm text-slate-500">
            支持手机号、学号或“姓名 + 手机号后四位”查询。
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {QUERY_METHOD_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`rounded-xl border px-4 py-3 text-sm ${
                mode === item.value
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
              onClick={() => setMode(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {mode === "phone" ? (
          <div>
            <label className="label">手机号</label>
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        ) : null}

        {mode === "studentId" ? (
          <div>
            <label className="label">学号</label>
            <input className="input" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
          </div>
        ) : null}

        {mode === "namePhoneSuffix" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">姓名</label>
              <input className="input" value={senderName} onChange={(e) => setSenderName(e.target.value)} />
            </div>
            <div>
              <label className="label">手机号后四位</label>
              <input className="input" value={phoneSuffix} onChange={(e) => setPhoneSuffix(e.target.value)} />
            </div>
          </div>
        ) : null}

        {message ? <p className="text-sm text-slate-600">{message}</p> : null}

        <button type="submit" className="primary-button" disabled={loading}>
          {loading ? "查询中..." : "开始查询"}
        </button>
      </form>

      <div className="space-y-4">
        {results.map((item) => (
          <div key={item.id} className="card p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">信件编号</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{item.displayCode}</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                {STATUS_CODE_TO_NAME[item.status]}
              </span>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div>学校：{item.schoolName}</div>
              <div>摊位：{item.boothName}</div>
              <div>寄件人：{item.senderName}</div>
              <div>信件类型：{item.letterTypeName}</div>
              <div className="sm:col-span-2">提交时间：{formatDateTime(item.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
