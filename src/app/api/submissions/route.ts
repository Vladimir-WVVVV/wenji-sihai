import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { fail, ok } from "@/lib/response";
import { submissionSchema } from "@/lib/validators";
import { generateSubmissionCodes } from "@/lib/codes";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = submissionSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("提交内容校验失败", 400, {
      errors: parsed.error.flatten(),
    });
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const activityCampus = await tx.campus.findUnique({
          where: { id: data.activityCampusId },
          include: { school: true },
        });

        if (
          !activityCampus ||
          !activityCampus.hasBooth ||
          !activityCampus.isEnabled ||
          activityCampus.deletedAt ||
          !activityCampus.school.isActive ||
          activityCampus.school.deletedAt
        ) {
          throw new Error("活动校区无效、非摆点或已停用");
        }

        const booth = await tx.booth.findFirst({
          where: {
            id: data.boothId,
            campusId: activityCampus.id,
            isActive: true,
            deletedAt: null,
          },
        });

        if (!booth) {
          throw new Error("摊位无效或不属于所选活动校区");
        }

        const letterType = await tx.letterType.findUnique({
          where: { code: data.letterTypeCode },
        });

        if (!letterType || !letterType.isActive) {
          throw new Error("信件类型无效");
        }

        let recipientSchoolId: number | null = null;
        let recipientCampusId: number | null = null;

        if (data.letterTypeCode === "DX") {
          if (data.recipientSchoolId == null || data.recipientCampusId == null) {
            throw new Error("定向寄信须选择收信学校与收信校区");
          }

          const recipientSchool = await tx.school.findUnique({
            where: { id: data.recipientSchoolId },
          });

          if (!recipientSchool || !recipientSchool.isActive || recipientSchool.deletedAt) {
            throw new Error("收信学校无效或已停用");
          }

          const recipientCampus = await tx.campus.findUnique({
            where: { id: data.recipientCampusId },
            include: { school: true },
          });

          if (
            !recipientCampus ||
            recipientCampus.schoolId !== recipientSchool.id ||
            !recipientCampus.isEnabled ||
            recipientCampus.deletedAt ||
            !recipientCampus.school.isActive ||
            recipientCampus.school.deletedAt
          ) {
            throw new Error("收信校区与收信学校不一致，或收信校区已停用");
          }

          recipientSchoolId = recipientSchool.id;
          recipientCampusId = recipientCampus.id;
        }

        const codes = await generateSubmissionCodes(tx, activityCampus.id, letterType.id);

        const submission = await tx.submission.create({
          data: {
            schoolId: activityCampus.schoolId,
            activityCampusId: activityCampus.id,
            recipientSchoolId,
            recipientCampusId,
            boothId: booth.id,
            letterTypeId: letterType.id,
            senderName: data.senderName,
            studentId: data.studentId,
            phone: data.phone,
            senderAddress: data.senderAddress,
            college: data.college || null,
            grade: data.grade || null,
            recipientName: data.recipientName || null,
            recipientPhone: data.recipientPhone || null,
            recipientAddress: data.recipientAddress || null,
            recipientSchoolGrade: data.recipientSchoolGrade || null,
            recipientRemark: data.recipientRemark || null,
            freeLetterTopic: data.freeLetterTopic || null,
            displayCode: codes.displayCode,
            rawCode: codes.rawCode,
          },
          include: {
            school: true,
            activityCampus: true,
            recipientSchool: true,
            recipientCampus: true,
            booth: true,
            letterType: true,
          },
        });

        return submission;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10000,
        timeout: 20000,
      },
    );

    return ok(
      {
        id: result.id,
        displayCode: result.displayCode,
        rawCode: result.rawCode,
        activitySchoolName: result.school.name,
        activityCampusLabel: `${result.school.name}（${result.activityCampus?.name ?? ""}）`,
        recipientSchoolName:
          result.letterType.code === "BDX" ? "—" : (result.recipientSchool?.name ?? "—"),
        recipientCampusLabel:
          result.letterType.code === "BDX"
            ? "—"
            : result.recipientCampus
              ? `${result.recipientSchool?.name ?? ""}（${result.recipientCampus.name}）`
              : "—",
        boothName: result.booth.name,
        letterTypeName: result.letterType.name,
        createdAt: result.createdAt,
      },
      "提交成功",
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "提交失败", 400);
  }
}
