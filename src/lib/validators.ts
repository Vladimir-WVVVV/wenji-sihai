import { z } from "zod";

const phoneSchema = z
  .string()
  .regex(/^1\d{10}$/, "请输入正确的手机号");

export const submissionSchema = z
  .object({
    schoolId: z.coerce.number().int().positive("请选择学校"),
    boothId: z.coerce.number().int().positive("请选择摊位"),
    letterTypeCode: z.enum(["DX", "BDX", "HX"]),
    senderName: z.string().min(2, "请填写寄件人姓名").max(30),
    studentId: z.string().min(3, "请填写学号").max(50),
    phone: phoneSchema,
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
    if (value.letterTypeCode === "DX" || value.letterTypeCode === "HX") {
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
  schoolCode: z.string().min(2),
  name: z.string().min(2, "请填写摊位名称").max(50),
  isActive: z.boolean().optional(),
});

export const boothUpdateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  isActive: z.boolean().optional(),
});
