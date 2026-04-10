import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^1\d{10}$/, "请输入正确的手机号");

/** 空串 / 缺省视为未填；仅定向寄信时由 superRefine 要求必填 */
const optionalRecipientId = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return undefined;
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}, z.number().int().positive().optional());

export const submissionSchema = z
  .object({
    activityCampusId: z.coerce.number().int().positive("请选择参与活动的校区单位"),
    boothId: z.coerce.number().int().positive("请选择摊位"),
    recipientSchoolId: optionalRecipientId,
    recipientCampusId: optionalRecipientId,
    letterTypeCode: z.enum(["DX", "BDX"]),
    senderName: z.string().min(2, "请填写寄件人姓名").max(30),
    studentId: z.string().min(3, "请填写学号").max(50),
    phone: phoneSchema,
    senderAddress: z.string().min(5, "请填写寄信人住址").max(200),
    college: z.string().max(100).optional().or(z.literal("")),
    grade: z.string().max(50).optional().or(z.literal("")),
    recipientName: z.string().max(50).optional().or(z.literal("")),
    recipientPhone: z.string().optional().or(z.literal("")),
    recipientAddress: z.string().max(200).optional().or(z.literal("")),
    recipientSchoolGrade: z.string().max(100).optional().or(z.literal("")),
    recipientRemark: z.string().max(200).optional().or(z.literal("")),
    freeLetterTopic: z.string().max(200).optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.letterTypeCode === "DX") {
      if (value.recipientSchoolId == null) {
        ctx.addIssue({
          code: "custom",
          path: ["recipientSchoolId"],
          message: "请选择收信学校",
        });
      }
      if (value.recipientCampusId == null) {
        ctx.addIssue({
          code: "custom",
          path: ["recipientCampusId"],
          message: "请选择收信校区",
        });
      }
      if (!value.recipientName) {
        ctx.addIssue({ code: "custom", path: ["recipientName"], message: "请填写收信人姓名" });
      }
      if (!value.recipientPhone) {
        ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: "请填写收信人联系方式" });
      } else if (!/^1\d{10}$/.test(value.recipientPhone)) {
        ctx.addIssue({ code: "custom", path: ["recipientPhone"], message: "请输入正确的收信人手机号" });
      }
      if (!value.recipientAddress) {
        ctx.addIssue({ code: "custom", path: ["recipientAddress"], message: "请填写收信地址" });
      }
    }
  });

export const querySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("phone"),
    phone: phoneSchema,
  }),
  z.object({
    mode: z.literal("studentId"),
    studentId: z.string().min(3, "请输入学号"),
  }),
  z.object({
    mode: z.literal("namePhoneSuffix"),
    senderName: z.string().min(2, "请输入姓名"),
    phoneSuffix: z.string().regex(/^\d{4}$/, "请输入手机号后四位"),
  }),
]);

export const adminLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
});

export const updateStatusSchema = z.object({
  status: z.enum(["SUBMITTED", "RECEIVED", "VERIFIED", "SORTED", "SENT", "COMPLETED"]),
});

export const boothSchema = z.object({
  campusId: z.coerce.number().int().positive("请选择所属校区"),
  name: z.string().min(2, "请填写摊位名称").max(50),
  isActive: z.boolean().optional(),
});

export const boothUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
  /// 补全历史摊位所属校区；写入后会同步 schoolId
  campusId: z.coerce.number().int().positive().optional(),
});

export const schoolSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "请填写学校代码")
    .max(20, "学校代码过长")
    .regex(/^[A-Z0-9_]+$/, "学校代码仅支持大写字母、数字和下划线"),
  name: z.string().trim().min(2, "请填写学校名称").max(50, "学校名称过长"),
});

export const campusCreateSchema = z.object({
  schoolCode: z.string().min(2),
  code: z
    .string()
    .trim()
    .min(2, "请填写校区代码")
    .max(20, "校区代码过长")
    .regex(/^[A-Z0-9_]+$/, "校区代码仅支持大写字母、数字和下划线"),
  name: z.string().trim().min(2, "请填写校区名称").max(50),
  hasBooth: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const campusUpdateSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  hasBooth: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
  isEnabled: z.boolean().optional(),
});
