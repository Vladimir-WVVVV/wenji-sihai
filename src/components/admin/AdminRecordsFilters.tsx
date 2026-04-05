"use client";

import { useMemo, useState } from "react";

import { LETTER_TYPE_OPTIONS, SCHOOL_OPTIONS, SUBMISSION_STATUS_OPTIONS } from "@/config/constants";

type SchoolRow = {
  code: string;
  name: string;
};

type BoothRow = {
  id: number;
  name: string;
  school: {
    code: string;
    name: string;
  };
};

type FilterState = {
  schoolCode: string;
  boothId: string;
  letterTypeCode: string;
  status: string;
  senderName: string;
  studentId: string;
  displayCode: string;
  createdFrom: string;
  createdTo: string;
  sort: "asc" | "desc";
};

type Props = {
  schools: SchoolRow[];
  booths: BoothRow[];
  isSuperAdmin: boolean;
  initialFilters: FilterState;
};

function supportsReply(schoolCode: string) {
  return SCHOOL_OPTIONS.find((item) => item.code === schoolCode)?.supportsReply ?? true;
}

export function AdminRecordsFilters({
  schools,
  booths,
  isSuperAdmin,
  initialFilters,
}: Props) {
  const [filters, setFilters] = useState<FilterState>(() => {
    const hasSelectedSchool = Boolean(initialFilters.schoolCode);
    const visibleBooths = hasSelectedSchool
      ? booths.filter((item) => item.school.code === initialFilters.schoolCode)
      : [];
    const boothExists = visibleBooths.some((item) => String(item.id) === initialFilters.boothId);
    const canUseReply =
      !initialFilters.schoolCode || supportsReply(initialFilters.schoolCode);

    return {
      ...initialFilters,
      boothId: boothExists ? initialFilters.boothId : "",
      letterTypeCode:
        initialFilters.letterTypeCode === "HX" && !canUseReply
          ? ""
          : initialFilters.letterTypeCode,
    };
  });

  const availableBooths = useMemo(() => {
    if (!filters.schoolCode) return [];
    return booths.filter((item) => item.school.code === filters.schoolCode);
  }, [booths, filters.schoolCode]);

  const availableLetterTypes = useMemo(() => {
    if (!filters.schoolCode) return LETTER_TYPE_OPTIONS;
    return supportsReply(filters.schoolCode)
      ? LETTER_TYPE_OPTIONS
      : LETTER_TYPE_OPTIONS.filter((item) => item.code !== "HX");
  }, [filters.schoolCode]);

  const boothDisabled = isSuperAdmin ? !filters.schoolCode || availableBooths.length === 0 : availableBooths.length === 0;
  const noBoothsForSchool = Boolean(filters.schoolCode) && availableBooths.length === 0;
  const needsSchoolFirst = isSuperAdmin && !filters.schoolCode;

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();

    if (filters.schoolCode) params.set("schoolCode", filters.schoolCode);
    if (filters.boothId) params.set("boothId", filters.boothId);
    if (filters.letterTypeCode) params.set("letterTypeCode", filters.letterTypeCode);
    if (filters.status) params.set("status", filters.status);
    if (filters.senderName) params.set("senderName", filters.senderName);
    if (filters.studentId) params.set("studentId", filters.studentId);
    if (filters.displayCode) params.set("displayCode", filters.displayCode);
    if (filters.createdFrom) params.set("createdFrom", filters.createdFrom);
    if (filters.createdTo) params.set("createdTo", filters.createdTo);
    if (filters.sort) params.set("sort", filters.sort);

    return `/api/admin/export?${params.toString()}`;
  }, [filters]);

  return (
    <form action="/admin/records" className="card grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
      <div>
        <label className="label">学校</label>
        <select
          name="schoolCode"
          className="input"
          value={filters.schoolCode}
          onChange={(event) => {
            const nextSchoolCode = event.target.value;
            setFilters((current) => ({
              ...current,
              schoolCode: nextSchoolCode,
              boothId: "",
              letterTypeCode: "",
            }));
          }}
        >
          <option value="">全部学校</option>
          {schools.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">摊位</label>
        <select
          name="boothId"
          className="input"
          value={filters.boothId}
          disabled={boothDisabled}
          onChange={(event) =>
            setFilters((current) => ({ ...current, boothId: event.target.value }))
          }
        >
          <option value="">
            {needsSchoolFirst ? "请先选择学校" : "全部摊位"}
          </option>
          {availableBooths.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        {noBoothsForSchool ? (
          <p className="mt-2 text-xs text-slate-500">请通知该校管理员进行添加点位</p>
        ) : null}
      </div>

      <div>
        <label className="label">信件类型</label>
        <select
          name="letterTypeCode"
          className="input"
          value={filters.letterTypeCode}
          onChange={(event) =>
            setFilters((current) => ({ ...current, letterTypeCode: event.target.value }))
          }
        >
          <option value="">全部类型</option>
          {availableLetterTypes.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">状态</label>
        <select
          name="status"
          className="input"
          value={filters.status}
          onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
        >
          <option value="">全部状态</option>
          {SUBMISSION_STATUS_OPTIONS.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">寄件人姓名</label>
        <input
          name="senderName"
          className="input"
          value={filters.senderName}
          onChange={(event) =>
            setFilters((current) => ({ ...current, senderName: event.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">学号</label>
        <input
          name="studentId"
          className="input"
          value={filters.studentId}
          onChange={(event) =>
            setFilters((current) => ({ ...current, studentId: event.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">编号</label>
        <input
          name="displayCode"
          className="input"
          value={filters.displayCode}
          onChange={(event) =>
            setFilters((current) => ({ ...current, displayCode: event.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">开始日期</label>
        <input
          name="createdFrom"
          type="date"
          className="input"
          value={filters.createdFrom}
          onChange={(event) =>
            setFilters((current) => ({ ...current, createdFrom: event.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">结束日期</label>
        <input
          name="createdTo"
          type="date"
          className="input"
          value={filters.createdTo}
          onChange={(event) =>
            setFilters((current) => ({ ...current, createdTo: event.target.value }))
          }
        />
      </div>

      <div>
        <label className="label">提交时间排序</label>
        <select
          name="sort"
          className="input"
          value={filters.sort}
          onChange={(event) =>
            setFilters((current) => ({
              ...current,
              sort: event.target.value === "asc" ? "asc" : "desc",
            }))
          }
        >
          <option value="desc">最新在前</option>
          <option value="asc">最早在前</option>
        </select>
      </div>

      <div className="flex items-end gap-3 md:col-span-2 xl:col-span-4">
        <button className="primary-button" type="submit">
          应用筛选
        </button>
        <a href="/admin/records" className="secondary-button">
          重置
        </a>
        <a href={exportHref} className="secondary-button">
          导出 CSV
        </a>
      </div>
    </form>
  );
}
