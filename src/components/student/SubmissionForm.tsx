"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { submissionSchema } from "@/lib/validators";
import { LETTER_TYPE_CODE_TO_NAME } from "@/config/constants";

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

type Props = {
  schools: School[];
};

type FormState = {
  schoolId: string;
  boothId: string;
  senderName: string;
  studentId: string;
  phone: string;
  college: string;
  grade: string;
  letterTypeCode: "DX" | "BDX" | "HX";
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  recipientSchoolGrade: string;
  recipientRemark: string;
  freeLetterTopic: string;
};

const initialState: FormState = {
  schoolId: "",
  boothId: "",
  senderName: "",
  studentId: "",
  phone: "",
  college: "",
  grade: "",
  letterTypeCode: "DX",
  recipientName: "",
  recipientPhone: "",
  recipientAddress: "",
  recipientSchoolGrade: "",
  recipientRemark: "",
  freeLetterTopic: "",
};

export function SubmissionForm({ schools }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>(
    {},
  );
  const [loading, setLoading] = useState(false);

  const selectedSchool = useMemo(
    () => schools.find((item) => String(item.id) === form.schoolId),
    [schools, form.schoolId],
  );

  const availableLetterTypes = useMemo(() => {
    if (selectedSchool?.code === "WHU") {
      return ["DX", "BDX", "HX"] as const;
    }
    return ["DX", "BDX"] as const;
  }, [selectedSchool]);

  const showRecipientFields = form.letterTypeCode === "DX" || form.letterTypeCode === "HX";

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setFieldErrors({});

    const parsed = submissionSchema.safeParse({
      ...form,
      schoolId: Number(form.schoolId),
      boothId: Number(form.boothId),
    });

    if (!parsed.success) {
      setLoading(false);
      setFieldErrors(parsed.error.flatten().fieldErrors);
      setMessage("请检查表单内容后重新提交");
      return;
    }

    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(result.message || "提交失败");
      if (result.errors?.fieldErrors) {
        setFieldErrors(result.errors.fieldErrors);
      }
      return;
    }

    router.push(
      `/success?code=${encodeURIComponent(result.data.displayCode)}&school=${encodeURIComponent(
        result.data.schoolName,
      )}&type=${encodeURIComponent(result.data.letterTypeName)}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">学校与摊位</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">学校</label>
            <select
              className="input"
              value={form.schoolId}
              onChange={(event) => {
                const schoolId = event.target.value;
                const school = schools.find((item) => String(item.id) === schoolId);
                setForm((current) => ({
                  ...current,
                  schoolId,
                  boothId: "",
                  letterTypeCode: school?.code === "WHU" ? current.letterTypeCode : current.letterTypeCode === "HX" ? "DX" : current.letterTypeCode,
                }));
              }}
            >
              <option value="">请选择学校</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
            {fieldErrors.schoolId?.[0] ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.schoolId[0]}</p>
            ) : null}
          </div>
          <div>
            <label className="label">摊位</label>
            <select
              className="input"
              value={form.boothId}
              onChange={(event) => updateForm("boothId", event.target.value)}
              disabled={!selectedSchool}
            >
              <option value="">请选择摊位</option>
              {selectedSchool?.booths.map((booth) => (
                <option key={booth.id} value={booth.id}>
                  {booth.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              摊位由后台维护，可按学校动态联动。
            </p>
            {fieldErrors.boothId?.[0] ? (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.boothId[0]}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">寄件人信息</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">寄件人姓名</label>
            <input className="input" value={form.senderName} onChange={(e) => updateForm("senderName", e.target.value)} />
          </div>
          <div>
            <label className="label">学号</label>
            <input className="input" value={form.studentId} onChange={(e) => updateForm("studentId", e.target.value)} />
          </div>
          <div>
            <label className="label">联系方式</label>
            <input className="input" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="请输入手机号" />
          </div>
          <div>
            <label className="label">学院 / 专业</label>
            <input className="input" value={form.college} onChange={(e) => updateForm("college", e.target.value)} />
          </div>
          <div>
            <label className="label">年级</label>
            <input className="input" value={form.grade} onChange={(e) => updateForm("grade", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">信件类型</h2>
        <div className="mt-4 grid gap-3">
          {availableLetterTypes.map((code) => (
            <label
              key={code}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
                form.letterTypeCode === code
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <input
                type="radio"
                name="letterTypeCode"
                value={code}
                checked={form.letterTypeCode === code}
                onChange={() => updateForm("letterTypeCode", code)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">{LETTER_TYPE_CODE_TO_NAME[code]}</div>
                <div className="mt-1 text-xs opacity-80">
                  {code === "DX"
                    ? "填写完整收信人信息，定向投递。"
                    : code === "BDX"
                      ? "不填写收信人信息，随机匹配。"
                      : "仅武汉大学可选，面向中小学生回信。"}
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {showRecipientFields ? "收信人信息" : "不定向寄信补充信息"}
        </h2>
        {showRecipientFields ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">收信人姓名</label>
              <input className="input" value={form.recipientName} onChange={(e) => updateForm("recipientName", e.target.value)} />
            </div>
            <div>
              <label className="label">收信人联系方式</label>
              <input className="input" value={form.recipientPhone} onChange={(e) => updateForm("recipientPhone", e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="label">收信地址</label>
              <textarea className="input min-h-24" value={form.recipientAddress} onChange={(e) => updateForm("recipientAddress", e.target.value)} />
            </div>
            {form.letterTypeCode === "HX" ? (
              <div>
                <label className="label">学校 / 年级</label>
                <input className="input" value={form.recipientSchoolGrade} onChange={(e) => updateForm("recipientSchoolGrade", e.target.value)} />
              </div>
            ) : null}
            <div className={form.letterTypeCode === "HX" ? "" : "md:col-span-2"}>
              <label className="label">备注</label>
              <input className="input" value={form.recipientRemark} onChange={(e) => updateForm("recipientRemark", e.target.value)} />
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label className="label">想对陌生朋友说的话主题 / 关键词</label>
            <textarea
              className="input min-h-24"
              value={form.freeLetterTopic}
              onChange={(e) => updateForm("freeLetterTopic", e.target.value)}
              placeholder="例如：大学遗憾、家乡风景、最喜欢的书"
            />
          </div>
        )}
      </section>

      {message ? <p className="text-sm text-rose-600">{message}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="primary-button flex-1" disabled={loading}>
          {loading ? "提交中..." : "提交并生成编号"}
        </button>
        <Link href="/query" className="secondary-button flex-1">
          查询我的编号
        </Link>
      </div>
    </form>
  );
}
