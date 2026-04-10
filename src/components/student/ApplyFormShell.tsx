"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { SubmissionForm } from "@/components/student/SubmissionForm";

const BOOTSTRAP_TIMEOUT_MS = 6000;

type Booth = {
  id: number;
  name: string;
  isActive: boolean;
};

export type ActivityCampusOption = {
  id: number;
  schoolId: number;
  schoolCode: string;
  schoolName: string;
  campusCode: string;
  campusName: string;
  displayLabel: string;
  booths: Booth[];
};

export type RecipientSchoolOption = {
  id: number;
  code: string;
  name: string;
  campuses: Array<{
    id: number;
    code: string;
    name: string;
    hasBooth: boolean;
  }>;
};

type BootstrapResponse = {
  success: boolean;
  message: string;
  data?: {
    activityCampuses: ActivityCampusOption[];
    recipientSchools: RecipientSchoolOption[];
  };
};

export function ApplyFormShell() {
  const [activityCampuses, setActivityCampuses] = useState<ActivityCampusOption[] | null>(null);
  const [recipientSchools, setRecipientSchools] = useState<RecipientSchoolOption[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [timedOut, setTimedOut] = useState(false);

  const loadBootstrap = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
      setMessage("");
      setTimedOut(false);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setTimedOut(true);
      controller.abort();
    }, BOOTSTRAP_TIMEOUT_MS);

    try {
      const response = await fetch("/api/bootstrap", {
        cache: "no-store",
        signal: controller.signal,
      });
      const result = (await response.json()) as BootstrapResponse;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "加载失败");
      }

      setActivityCampuses(result.data.activityCampuses);
      setRecipientSchools(result.data.recipientSchools);
    } catch (error) {
      const fallbackMessage =
        error instanceof Error && error.name === "AbortError"
          ? "活动数据加载较慢，请点击重试。"
          : error instanceof Error
            ? error.message
            : "当前暂时无法加载问卷数据";

      setMessage(fallbackMessage);
    } finally {
      window.clearTimeout(timeoutId);
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  if (loading) {
    return (
      <div className="card p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">正在准备填写表单</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              页面已打开，正在加载活动校区与摊位数据。若当前网络较慢，请稍候片刻。
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-11 rounded bg-slate-100" />
            <div className="h-11 rounded bg-slate-100" />
          </div>
          <div className="h-11 rounded bg-slate-100" />
          <div className="h-24 rounded bg-slate-100" />
          <p className="text-xs text-slate-400">
            若长时间未加载完成，可稍后点击“重新加载”。
          </p>
        </div>
      </div>
    );
  }

  if (!activityCampuses || !recipientSchools) {
    return (
      <div className="card max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-slate-950">填写活动信息</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {message || "当前暂时无法加载问卷数据，请稍后重试。"}
        </p>
        {timedOut ? (
          <p className="mt-2 text-xs leading-6 text-slate-500">
            当前页面主体已可见，只有数据加载较慢；重新加载后通常可恢复。
          </p>
        ) : null}
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

  if (activityCampuses.length === 0) {
    return (
      <div className="card max-w-2xl p-6">
        <h2 className="text-xl font-semibold text-slate-950">填写活动信息</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          当前没有可用的摆点校区。请联系管理员配置「摆点校区」及摊位后再填写。
        </p>
        <div className="mt-5">
          <Link href="/" className="secondary-button">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SubmissionForm activityCampuses={activityCampuses} recipientSchools={recipientSchools} />
  );
}
