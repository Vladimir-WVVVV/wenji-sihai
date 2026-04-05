"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SubmissionForm } from "@/components/student/SubmissionForm";

type Booth = {
  id: number;
  name: string;
  isActive: boolean;
};

type School = {
  id: number;
  code: string;
  name: string;
  booths: Booth[];
};

type BootstrapResponse = {
  success: boolean;
  message: string;
  data?: {
    schools: School[];
  };
};

export function ApplyFormShell() {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadBootstrap = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/bootstrap");
      const result = (await response.json()) as BootstrapResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "加载失败");
      }

      setSchools(result.data.schools);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "当前暂时无法加载学校与摊位数据");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-11 rounded bg-slate-100" />
            <div className="h-11 rounded bg-slate-100" />
          </div>
          <div className="h-11 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (!schools) {
    return (
      <div className="card max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-slate-950">填写活动信息</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {message || "当前暂时无法加载学校与摊位数据，请稍后重试。"}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="primary-button" onClick={() => void loadBootstrap()}>
            重新加载
          </button>
          <Link href="/" className="secondary-button">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return <SubmissionForm schools={schools} />;
}
