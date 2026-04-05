"use client";

import { useMemo, useState } from "react";

type BoothRow = {
  id: number;
  name: string;
  isActive: boolean;
  school: {
    code: string;
    name: string;
  };
};

type SchoolRow = {
  code: string;
  name: string;
};

type Props = {
  schools: SchoolRow[];
  booths: BoothRow[];
  defaultSchoolCode?: string | null;
  isSuperAdmin: boolean;
};

export function BoothManager({
  schools,
  booths,
  defaultSchoolCode,
  isSuperAdmin,
}: Props) {
  const [schoolCode, setSchoolCode] = useState(defaultSchoolCode || schools[0]?.code || "");
  const [boothRows, setBoothRows] = useState(booths);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const visibleBooths = useMemo(() => {
    if (isSuperAdmin && schoolCode) {
      return boothRows.filter((item) => item.school.code === schoolCode);
    }
    return boothRows;
  }, [boothRows, isSuperAdmin, schoolCode]);

  async function createBooth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/booths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ schoolCode, name }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "新增失败");
      return;
    }

    setName("");
    setMessage("新增成功");
    setBoothRows((current) => [...current, result.data]);
  }

  async function updateBooth(id: number, payload: { name?: string; isActive?: boolean }) {
    const response = await fetch(`/api/admin/booths/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message || "更新失败");
      return;
    }
    setEditingId(null);
    setEditingName("");
    setMessage("更新成功");
    setBoothRows((current) =>
      current.map((item) => (item.id === id ? result.data : item)),
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createBooth} className="card space-y-4 p-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">新增摊位</h3>
          <p className="mt-1 text-sm text-slate-500">支持后续新增、编辑、启用或停用。</p>
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
            <label className="label">摊位名称</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="input"
              placeholder="例如：梅园食堂"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="primary-button" disabled={loading}>
            {loading ? "提交中..." : "新增摊位"}
          </button>
          {message ? <span className="hint">{message}</span> : null}
        </div>
      </form>

      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-semibold text-slate-900">摊位列表</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">学校</th>
                <th className="px-4 py-3">摊位名称</th>
                <th className="px-4 py-3">状态</th>
                <th className="px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleBooths.map((booth) => (
                <tr key={booth.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">{booth.school.name}</td>
                  <td className="px-4 py-3">
                    {editingId === booth.id ? (
                      <input
                        className="input"
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                    ) : (
                      booth.name
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {booth.isActive ? "启用中" : "已停用"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {editingId === booth.id ? (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => updateBooth(booth.id, { name: editingName })}
                        >
                          保存名称
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setEditingId(booth.id);
                            setEditingName(booth.name);
                          }}
                        >
                          编辑名称
                        </button>
                      )}
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          updateBooth(booth.id, { isActive: !booth.isActive })
                        }
                      >
                        {booth.isActive ? "停用" : "启用"}
                      </button>
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
