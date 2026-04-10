"use client";

import { useState } from "react";

type SchoolRow = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  deletedAt: Date | string | null;
  _count: {
    campuses: number;
    submissions: number;
  };
};

type Props = {
  schools: SchoolRow[];
};

export function SchoolManager({ schools }: Props) {
  const [schoolRows, setSchoolRows] = useState(schools);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSchool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: code.trim().toUpperCase(),
        name: name.trim(),
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "新增学校失败");
      return;
    }

    setCode("");
    setName("");
    setMessage("新增学校成功");
    setSchoolRows((current) => [...current, result.data]);
  }

  async function deleteSchool(school: SchoolRow) {
    const confirmed = window.confirm(
      "确认删除该学校吗？若已有历史业务数据，系统会自动归档并从问卷和筛选项中移除。",
    );
    if (!confirmed) {
      return;
    }

    setMessage("");
    const response = await fetch(`/api/admin/schools/${school.id}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "删除学校失败");
      return;
    }

    setMessage(result.message || "删除学校成功");

    if (result.data?.mode === "deleted") {
      setSchoolRows((current) => current.filter((item) => item.id !== school.id));
      return;
    }

    if (result.data?.school) {
      setSchoolRows((current) =>
        current.map((item) => (item.id === school.id ? result.data.school : item)),
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createSchool} className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">新增学校</h3>
          <p className="mt-1 text-sm text-slate-500">
            新增后会创建默认「主校区」摆点校区，并初始化该校区的两种信件类型编号计数器。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">学校代码</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="input"
              placeholder="例如：PKU"
            />
          </div>
          <div>
            <label className="label">学校名称</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="例如：北京大学"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "提交中..." : "新增学校"}
          </button>
          {message ? <span className="hint">{message}</span> : null}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">学校列表</h3>
          <p className="mt-1 text-sm text-slate-500">
            有历史记录的学校删除时会自动转为归档状态，不会破坏已有提交记录。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">学校代码</th>
                <th className="px-4 py-3">学校名称</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">校区数</th>
                <th className="px-4 py-3">历史记录数</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {schoolRows.map((school) => (
                <tr key={school.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{school.code}</td>
                  <td className="px-4 py-3">{school.name}</td>
                  <td className="px-4 py-3">
                    {school.deletedAt ? "已删除归档" : school.isActive ? "启用中" : "已停用"}
                  </td>
                  <td className="px-4 py-3">{school._count.campuses}</td>
                  <td className="px-4 py-3">{school._count.submissions}</td>
                  <td className="px-4 py-3">
                    {!school.deletedAt ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => deleteSchool(school)}
                      >
                        删除学校
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500">已归档，禁止继续操作</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
