"use client";

import { useMemo, useState } from "react";

type SchoolRow = {
  code: string;
  name: string;
};

type CampusRow = {
  id: number;
  code: string;
  name: string;
  hasBooth: boolean;
  sortOrder: number;
  isEnabled: boolean;
  deletedAt: Date | string | null;
  school: { code: string; name: string };
  _count: {
    booths: number;
    activitySubmissions: number;
    recipientSubmissions: number;
  };
};

type Props = {
  schools: SchoolRow[];
  campuses: CampusRow[];
  defaultSchoolCode?: string | null;
  isSuperAdmin: boolean;
};

export function CampusManager({
  schools,
  campuses: initialCampuses,
  defaultSchoolCode,
  isSuperAdmin,
}: Props) {
  const [schoolCode, setSchoolCode] = useState(defaultSchoolCode || schools[0]?.code || "");
  const [rows, setRows] = useState(initialCampuses);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [hasBooth, setHasBooth] = useState(true);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const visible = useMemo(() => {
    if (isSuperAdmin && schoolCode) {
      return rows.filter((item) => item.school.code === schoolCode);
    }
    return rows;
  }, [rows, isSuperAdmin, schoolCode]);

  async function createCampus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/campuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        schoolCode,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        hasBooth,
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "新增失败");
      return;
    }

    setCode("");
    setName("");
    setHasBooth(true);
    setMessage("新增成功");
    setRows((current) => [...current, result.data]);
  }

  async function patchCampus(id: number, payload: Record<string, unknown>) {
    const response = await fetch(`/api/admin/campuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || "更新失败");
      return;
    }
    setMessage("已保存");
    setRows((current) => current.map((item) => (item.id === id ? result.data : item)));
  }

  async function deleteCampus(campus: CampusRow) {
    const confirmed = window.confirm(
      "确认归档或删除该校区吗？若存在历史记录将仅归档；无关联数据时将物理删除。此操作仅限超级管理员。",
    );
    if (!confirmed) return;

    setMessage("");
    const response = await fetch(`/api/admin/campuses/${campus.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || "操作失败");
      return;
    }

    setMessage(result.message || "操作成功");
    if (result.data?.mode === "deleted") {
      setRows((current) => current.filter((item) => item.id !== campus.id));
    } else {
      setRows((current) =>
        current.map((item) =>
          item.id === campus.id
            ? { ...item, deletedAt: new Date(), isEnabled: false, hasBooth: false }
            : item,
        ),
      );
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createCampus} className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">新增校区</h3>
          <p className="mt-1 text-sm text-slate-500">
            摆点校区会出现在学生问卷「活动单位」中并参与独立编号；非摆点校区仅作收信去向。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">所属学校</label>
            <select
              value={schoolCode}
              onChange={(event) => setSchoolCode(event.target.value)}
              className="input"
              disabled={!isSuperAdmin}
            >
              {schools.map((school) => (
                <option key={school.code} value={school.code}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">校区代码</label>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="input"
              placeholder="大写字母/数字/下划线，如 PEITU"
            />
          </div>
          <div>
            <label className="label">校区名称</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="例如：北洋园校区"
            />
          </div>
          <div className="flex items-center gap-3 pt-7">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={hasBooth}
                onChange={(event) => setHasBooth(event.target.checked)}
              />
              摆点校区（可挂摊位并参与编号）
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "提交中..." : "新增校区"}
          </button>
          {message ? <span className="hint">{message}</span> : null}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">校区列表</h3>
          <p className="mt-1 text-sm text-slate-500">
            历史登记数包含以本校区为活动校区或收信校区的记录。归档校区会从问卷选项中移除。
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">学校</th>
                <th className="px-4 py-3">校区</th>
                <th className="px-4 py-3">代码</th>
                <th className="px-4 py-3">摆点</th>
                <th className="px-4 py-3">摊位</th>
                <th className="px-4 py-3">活动登记</th>
                <th className="px-4 py-3">收信记录</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((campus) => (
                <tr key={campus.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{campus.school.name}</td>
                  <td className="px-4 py-3">{campus.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{campus.code}</td>
                  <td className="px-4 py-3">{campus.hasBooth ? "是" : "否"}</td>
                  <td className="px-4 py-3">{campus._count.booths}</td>
                  <td className="px-4 py-3">{campus._count.activitySubmissions}</td>
                  <td className="px-4 py-3">{campus._count.recipientSubmissions}</td>
                  <td className="px-4 py-3">
                    {campus.deletedAt ? "已归档" : campus.isEnabled ? "启用" : "停用"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {!campus.deletedAt ? (
                        <>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() =>
                              patchCampus(campus.id, { hasBooth: !campus.hasBooth })
                            }
                          >
                            {campus.hasBooth ? "改为非摆点" : "改为摆点"}
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => patchCampus(campus.id, { isEnabled: !campus.isEnabled })}
                          >
                            {campus.isEnabled ? "停用" : "启用"}
                          </button>
                        </>
                      ) : null}
                      {isSuperAdmin && !campus.deletedAt ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => deleteCampus(campus)}
                        >
                          归档/删除
                        </button>
                      ) : null}
                    </div>
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
