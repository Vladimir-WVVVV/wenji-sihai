"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "登录失败");
      return;
    }

    const redirectPath = searchParams.get("redirect");
    const target =
      redirectPath && redirectPath.startsWith("/admin") ? redirectPath : "/admin";

    window.location.href = target;
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-6 p-6 sm:p-8">
      <div>
        <p className="text-sm font-medium text-slate-500">文寄四海</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">管理员登录</h1>
        <p className="mt-2 text-sm text-slate-500">
          登录后可查看本校活动数据、导出记录并维护摊位。
        </p>
      </div>

      <div>
        <label className="label">用户名</label>
        <input
          className="input"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="请输入管理员账号"
        />
      </div>

      <div>
        <label className="label">密码</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="请输入密码"
        />
      </div>

      {message ? <p className="text-sm text-rose-600">{message}</p> : null}

      <button type="submit" className="primary-button w-full" disabled={loading}>
        {loading ? "登录中..." : "登录后台"}
      </button>
    </form>
  );
}
