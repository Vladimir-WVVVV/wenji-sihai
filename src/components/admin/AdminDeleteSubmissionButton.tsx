"use client";

import { useState } from "react";

type Props = {
  submissionId: number;
  onDeleted?: (submissionId: number) => void;
  redirectTo?: string;
  className?: string;
};

export function AdminDeleteSubmissionButton({
  submissionId,
  onDeleted,
  redirectTo,
  className = "secondary-button",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm("确认删除这条提交记录吗？删除后不可恢复，且不会回退编号计数。");
    if (!confirmed) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/admin/records/${submissionId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "删除失败");
      }

      setMessage("删除成功");
      onDeleted?.(submissionId);

      if (redirectTo) {
        window.location.href = redirectTo;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" className={className} onClick={handleDelete} disabled={loading}>
        {loading ? "删除中..." : "删除记录"}
      </button>
      {message ? <p className="hint">{message}</p> : null}
    </div>
  );
}
