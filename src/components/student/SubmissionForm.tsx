"use client";



import Link from "next/link";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";



import type { ActivityCampusOption, RecipientSchoolOption } from "@/components/student/ApplyFormShell";

import { submissionSchema } from "@/lib/validators";

import { LETTER_TYPE_CODE_TO_NAME } from "@/config/constants";



type Props = {

  activityCampuses: ActivityCampusOption[];

  recipientSchools: RecipientSchoolOption[];

};



type FormState = {

  activityCampusId: string;

  boothId: string;

  recipientSchoolId: string;

  recipientCampusId: string;

  senderName: string;

  studentId: string;

  phone: string;

  senderAddress: string;

  college: string;

  grade: string;

  letterTypeCode: "DX" | "BDX";

  recipientName: string;

  recipientPhone: string;

  recipientAddress: string;

  recipientRemark: string;

  freeLetterTopic: string;

};



const initialState: FormState = {

  activityCampusId: "",

  boothId: "",

  recipientSchoolId: "",

  recipientCampusId: "",

  senderName: "",

  studentId: "",

  phone: "",

  senderAddress: "",

  college: "",

  grade: "",

  letterTypeCode: "DX",

  recipientName: "",

  recipientPhone: "",

  recipientAddress: "",

  recipientRemark: "",

  freeLetterTopic: "",

};



export function SubmissionForm({ activityCampuses, recipientSchools }: Props) {

  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);

  const [message, setMessage] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const [loading, setLoading] = useState(false);



  const selectedActivityCampus = useMemo(

    () => activityCampuses.find((item) => String(item.id) === form.activityCampusId),

    [activityCampuses, form.activityCampusId],

  );



  const selectedRecipientSchool = useMemo(

    () => recipientSchools.find((item) => String(item.id) === form.recipientSchoolId),

    [recipientSchools, form.recipientSchoolId],

  );



  const availableLetterTypes = useMemo(() => ["DX", "BDX"] as const, []);

  const showRecipientFields = form.letterTypeCode === "DX";



  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {

    setForm((current) => ({ ...current, [key]: value }));

  }



  function setLetterTypeCode(code: "DX" | "BDX") {

    setForm((current) => ({

      ...current,

      letterTypeCode: code,

      ...(code === "BDX"

        ? { recipientSchoolId: "", recipientCampusId: "" }

        : {}),

    }));

    setFieldErrors((current) => {

      const next = { ...current };

      delete next.recipientSchoolId;

      delete next.recipientCampusId;

      return next;

    });

  }



  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setLoading(true);

    setMessage("");

    setFieldErrors({});



    const basePayload = {

      senderName: form.senderName,

      studentId: form.studentId,

      phone: form.phone,

      senderAddress: form.senderAddress,

      college: form.college,

      grade: form.grade,

      letterTypeCode: form.letterTypeCode,

      recipientName: form.recipientName,

      recipientPhone: form.recipientPhone,

      recipientAddress: form.recipientAddress,

      recipientRemark: form.recipientRemark,

      freeLetterTopic: form.freeLetterTopic,

      activityCampusId: Number(form.activityCampusId),

      boothId: Number(form.boothId),

    };



    const parsed = submissionSchema.safeParse(

      form.letterTypeCode === "DX"

        ? {

            ...basePayload,

            recipientSchoolId: form.recipientSchoolId,

            recipientCampusId: form.recipientCampusId,

          }

        : basePayload,

    );



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



    router.push(`/success?code=${encodeURIComponent(result.data.displayCode)}`);

  }



  return (

    <form onSubmit={handleSubmit} className="space-y-6">

      <section className="card p-5 sm:p-6">

        <h2 className="text-lg font-semibold text-slate-900">活动登记单位与摊位</h2>

        <p className="mt-1 text-sm text-slate-500">

          请选择您参与现场活动的<strong>摆点校区</strong>及对应摊位；无摆点校区不会出现在此列表中。

        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">

          <div>

            <label className="label">参与活动校区单位</label>

            <select

              className="input"

              value={form.activityCampusId}

              onChange={(event) => {

                const activityCampusId = event.target.value;

                setForm((current) => ({

                  ...current,

                  activityCampusId,

                  boothId: "",

                }));

              }}

            >

              <option value="">请选择校区（学校 + 校区）</option>

              {activityCampuses.map((campus) => (

                <option key={campus.id} value={campus.id}>

                  {campus.displayLabel}

                </option>

              ))}

            </select>

            {fieldErrors.activityCampusId?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.activityCampusId[0]}</p>

            ) : null}

          </div>

          <div>

            <label className="label">摊位</label>

            <select

              className="input"

              value={form.boothId}

              onChange={(event) => updateForm("boothId", event.target.value)}

              disabled={!selectedActivityCampus || selectedActivityCampus.booths.length === 0}

            >

              <option value="">请选择摊位</option>

              {selectedActivityCampus?.booths.map((booth) => (

                <option key={booth.id} value={booth.id}>

                  {booth.name}

                </option>

              ))}

            </select>

            {selectedActivityCampus ? (

              selectedActivityCampus.booths.length > 0 ? (

                <p className="mt-1 text-xs text-slate-500">

                  仅展示所选校区下的摊位，与后台配置实时同步。

                </p>

              ) : (

                <p className="mt-1 text-xs text-amber-700">

                  该校区暂无可用摊位，请通知管理员在后台为该校区添加摊位后再登记。

                </p>

              )

            ) : (

              <p className="mt-1 text-xs text-slate-500">请先选择参与活动校区，再选择摊位。</p>

            )}

            {fieldErrors.boothId?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.boothId[0]}</p>

            ) : null}

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

                onChange={() => setLetterTypeCode(code)}

                className="mt-1"

              />

              <div>

                <div className="font-medium">{LETTER_TYPE_CODE_TO_NAME[code]}</div>

                <div className="mt-1 text-xs opacity-80">

                  {code === "DX"

                    ? "需选择收信学校与校区，并填写完整收信人联系方式。"

                    : "无需选择收信学校与校区，由工作人员随机匹配；请填写主题关键词。"}

                </div>

              </div>

            </label>

          ))}

        </div>

        {fieldErrors.letterTypeCode?.[0] ? (

          <p className="mt-1 text-xs text-rose-600">{fieldErrors.letterTypeCode[0]}</p>

        ) : null}

      </section>



      {showRecipientFields ? (

        <section className="card p-5 sm:p-6">

          <h2 className="text-lg font-semibold text-slate-900">收信人学校校区</h2>

          <p className="mt-1 text-sm text-slate-500">

            仅<strong>定向寄信</strong>需填写。用于记录信件<strong>最终寄达</strong>的学校与校区（可选择无摆点校区，例如武汉大学医学部）。

          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">

            <div>

              <label className="label">收信学校</label>

              <select

                className="input"

                value={form.recipientSchoolId}

                onChange={(event) => {

                  const recipientSchoolId = event.target.value;

                  setForm((current) => ({

                    ...current,

                    recipientSchoolId,

                    recipientCampusId: "",

                  }));

                }}

              >

                <option value="">请选择收信学校</option>

                {recipientSchools.map((school) => (

                  <option key={school.id} value={school.id}>

                    {school.name}

                  </option>

                ))}

              </select>

              {fieldErrors.recipientSchoolId?.[0] ? (

                <p className="mt-1 text-xs text-rose-600">{fieldErrors.recipientSchoolId[0]}</p>

              ) : null}

            </div>

            <div>

              <label className="label">收信校区</label>

              <select

                className="input"

                value={form.recipientCampusId}

                onChange={(event) => updateForm("recipientCampusId", event.target.value)}

                disabled={!selectedRecipientSchool || selectedRecipientSchool.campuses.length === 0}

              >

                <option value="">请选择收信校区</option>

                {selectedRecipientSchool?.campuses.map((campus) => (

                  <option key={campus.id} value={campus.id}>

                    {campus.name}

                    {!campus.hasBooth ? "（无摆点，仅收信）" : ""}

                  </option>

                ))}

              </select>

              {fieldErrors.recipientCampusId?.[0] ? (

                <p className="mt-1 text-xs text-rose-600">{fieldErrors.recipientCampusId[0]}</p>

              ) : null}

            </div>

          </div>

        </section>

      ) : null}



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

            <label className="label">寄信人联系方式</label>

            <input className="input" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="请输入手机号" />

          </div>

          <div>

            <label className="label">学院 / 专业</label>

            <input className="input" value={form.college} onChange={(e) => updateForm("college", e.target.value)} />

          </div>

          <div className="md:col-span-2">

            <label className="label">寄信人住址</label>

            <textarea

              className="input min-h-24"

              value={form.senderAddress}

              onChange={(e) => updateForm("senderAddress", e.target.value)}

              placeholder="请填写可接收回信的详细地址"

            />

            {fieldErrors.senderAddress?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.senderAddress[0]}</p>

            ) : null}

          </div>

          <div>

            <label className="label">年级</label>

            <input className="input" value={form.grade} onChange={(e) => updateForm("grade", e.target.value)} />

          </div>

        </div>

      </section>



      <section className="card p-5 sm:p-6">

        <h2 className="text-lg font-semibold text-slate-900">

          {showRecipientFields ? "收信人联系信息" : "不定向寄信补充信息"}

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

            <div className="md:col-span-2">

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

        {showRecipientFields ? (

          <>

            {fieldErrors.recipientName?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.recipientName[0]}</p>

            ) : null}

            {fieldErrors.recipientPhone?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.recipientPhone[0]}</p>

            ) : null}

            {fieldErrors.recipientAddress?.[0] ? (

              <p className="mt-1 text-xs text-rose-600">{fieldErrors.recipientAddress[0]}</p>

            ) : null}

          </>

        ) : null}

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

