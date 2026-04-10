"use client";



import { useMemo, useState } from "react";



type BoothRow = {

  id: number;

  name: string;

  isActive: boolean;

  deletedAt: Date | string | null;

  campusId: number | null;

  campus: {

    id: number;

    name: string;

    school: {

      code: string;

      name: string;

    };

  } | null;

  school: {

    code: string;

    name: string;

  } | null;

};



type BoothCampusOption = {

  id: number;

  name: string;

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

  boothCampuses: BoothCampusOption[];

  booths: BoothRow[];

  defaultSchoolCode?: string | null;

  isSuperAdmin: boolean;

};



export function BoothManager({

  schools,

  boothCampuses,

  booths,

  defaultSchoolCode,

  isSuperAdmin,

}: Props) {

  const [schoolCode, setSchoolCode] = useState(defaultSchoolCode || schools[0]?.code || "");

  const [boothRows, setBoothRows] = useState(booths);

  const [campusId, setCampusId] = useState("");

  const [name, setName] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [editingName, setEditingName] = useState("");

  const [attachCampusByBooth, setAttachCampusByBooth] = useState<Record<number, string>>({});



  const campusesForSchool = useMemo(() => {

    if (isSuperAdmin && schoolCode) {

      return boothCampuses.filter((item) => item.school.code === schoolCode);

    }

    return boothCampuses;

  }, [boothCampuses, isSuperAdmin, schoolCode]);



  const visibleBooths = useMemo(() => {

    if (isSuperAdmin && schoolCode) {

      return boothRows.filter((item) => {

        const code = item.campus?.school.code ?? item.school?.code;

        return code === schoolCode;

      });

    }

    return boothRows;

  }, [boothRows, isSuperAdmin, schoolCode]);



  function schoolLabel(booth: BoothRow) {

    return booth.campus?.school.name ?? booth.school?.name ?? "—";

  }



  function campusLabel(booth: BoothRow) {

    return booth.campus?.name ?? "—（待补全）";

  }



  async function createBooth(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setLoading(true);

    setMessage("");



    const response = await fetch("/api/admin/booths", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({

        campusId: Number(campusId),

        name,

      }),

    });

    const result = await response.json();

    setLoading(false);



    if (!response.ok) {

      setMessage(result.message || "新增失败");

      return;

    }



    setName("");

    setCampusId("");

    setMessage("新增成功");

    setBoothRows((current) => [...current, result.data]);

  }



  async function updateBooth(id: number, payload: { name?: string; isActive?: boolean; campusId?: number }) {

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

    setBoothRows((current) => current.map((item) => (item.id === id ? result.data : item)));

  }



  async function deleteBooth(booth: BoothRow) {

    const confirmed = window.confirm(

      "确认删除该摊位吗？若已有关联历史记录，系统会自动归档并从问卷和筛选项中移除。",

    );

    if (!confirmed) {

      return;

    }



    setMessage("");

    const response = await fetch(`/api/admin/booths/${booth.id}`, {

      method: "DELETE",

    });

    const result = await response.json();

    if (!response.ok) {

      setMessage(result.message || "删除失败");

      return;

    }



    setMessage(result.message || "删除成功");

    setEditingId(null);

    setEditingName("");



    if (result.data?.mode === "deleted") {

      setBoothRows((current) => current.filter((item) => item.id !== booth.id));

      return;

    }



    if (result.data?.booth) {

      setBoothRows((current) =>

        current.map((item) => (item.id === booth.id ? result.data.booth : item)),

      );

    }

  }



  function campusesToAttach(booth: BoothRow) {

    const code = booth.school?.code ?? booth.campus?.school.code;

    if (!code) return [];

    return boothCampuses.filter((c) => c.school.code === code);

  }



  return (

    <div className="space-y-6">

      <form onSubmit={createBooth} className="card space-y-4 p-5">

        <div>

          <h3 className="text-lg font-semibold text-slate-900">新增摊位</h3>

          <p className="mt-1 text-sm text-slate-500">

            摊位必须挂在<strong>摆点校区</strong>下；请先在校区管理中开启「摆点」。

          </p>

        </div>



        <div className="grid gap-4 md:grid-cols-2">

          <div>

            <label className="label">所属学校</label>

            <select

              value={schoolCode}

              onChange={(event) => {

                setSchoolCode(event.target.value);

                setCampusId("");

              }}

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

            <label className="label">所属校区（摆点）</label>

            <select

              value={campusId}

              onChange={(event) => setCampusId(event.target.value)}

              className="input"

              disabled={campusesForSchool.length === 0}

            >

              <option value="">

                {campusesForSchool.length === 0 ? "暂无摆点校区" : "请选择校区"}

              </option>

              {campusesForSchool.map((c) => (

                <option key={c.id} value={c.id}>

                  {c.school.name} · {c.name}

                </option>

              ))}

            </select>

          </div>

          <div className="md:col-span-2">

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

          <button type="submit" className="primary-button" disabled={loading || !campusId}>

            {loading ? "提交中..." : "新增摊位"}

          </button>

          {message ? <span className="hint">{message}</span> : null}

        </div>

      </form>



      <div className="card overflow-hidden">

        <div className="border-b border-slate-200 px-5 py-4">

          <h3 className="text-lg font-semibold text-slate-900">摊位列表</h3>

          <p className="mt-1 text-sm text-slate-500">

            无校区 ID 的历史摊位不会出现在学生问卷中，请尽量补全所属摆点校区。

          </p>

        </div>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-slate-50 text-left text-slate-600">

              <tr>

                <th className="px-4 py-3">学校</th>

                <th className="px-4 py-3">校区</th>

                <th className="px-4 py-3">摊位名称</th>

                <th className="px-4 py-3">状态</th>

                <th className="px-4 py-3">操作</th>

              </tr>

            </thead>

            <tbody>

              {visibleBooths.map((booth) => (

                <tr key={booth.id} className="border-t border-slate-100">

                  <td className="px-4 py-3">{schoolLabel(booth)}</td>

                  <td className="px-4 py-3">

                    <div className="space-y-2">

                      <div>{campusLabel(booth)}</div>

                      {!booth.campusId && !booth.deletedAt ? (

                        <div className="flex flex-wrap items-center gap-2">

                          <select

                            className="input max-w-[220px] text-xs"

                            value={attachCampusByBooth[booth.id] ?? ""}

                            onChange={(event) =>

                              setAttachCampusByBooth((prev) => ({

                                ...prev,

                                [booth.id]: event.target.value,

                              }))

                            }

                          >

                            <option value="">选择摆点校区以补全</option>

                            {campusesToAttach(booth).map((c) => (

                              <option key={c.id} value={c.id}>

                                {c.name}

                              </option>

                            ))}

                          </select>

                          <button

                            type="button"

                            className="secondary-button text-xs"

                            disabled={!attachCampusByBooth[booth.id]}

                            onClick={() => {

                              const raw = attachCampusByBooth[booth.id];

                              if (!raw) return;

                              void updateBooth(booth.id, { campusId: Number(raw) });

                            }}

                          >

                            保存校区

                          </button>

                        </div>

                      ) : null}

                    </div>

                  </td>

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

                    {booth.deletedAt ? "已删除归档" : booth.isActive ? "启用中" : "已停用"}

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

                      ) : !booth.deletedAt ? (

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

                      ) : null}

                      {!booth.deletedAt ? (

                        <button

                          type="button"

                          className="secondary-button"

                          onClick={() =>

                            updateBooth(booth.id, { isActive: !booth.isActive })

                          }

                        >

                          {booth.isActive ? "停用" : "启用"}

                        </button>

                      ) : null}

                      <button

                        type="button"

                        className="secondary-button"

                        onClick={() => deleteBooth(booth)}

                      >

                        删除摊位

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

