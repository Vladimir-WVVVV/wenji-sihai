"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SUBMISSION_STATUS_OPTIONS } from "@/config/constants";

type Props = {
  submissionId: number;
  currentStatus: string;
};

export function AdminStatusForm({ submissionId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch(`/api/admin/records/${submissionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "状态更新失败");
      return;
    }

    setMessage("状态已更新");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="label">修改状态</label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="input"
        >
          {SUBMISSION_STATUS_OPTIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
        <button type="submit" className="primary-button sm:w-40" disabled={loading}>
          {loading ? "保存中..." : "保存状态"}
        </button>
      </div>
      {message ? <p className="hint">{message}</p> : null}
    </form>
  );
}
