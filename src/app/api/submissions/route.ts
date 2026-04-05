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
        const school = await tx.school.findUnique({
          where: { id: data.schoolId },
        });

        if (!school || !school.isActive) {
          throw new Error("学校无效或已停用");
        }

        const booth = await tx.booth.findFirst({
          where: {
            id: data.boothId,
            schoolId: school.id,
            isActive: true,
          },
        });

        if (!booth) {
          throw new Error("摊位无效或不属于当前学校");
        }

        const letterType = await tx.letterType.findUnique({
          where: { code: data.letterTypeCode },
        });

        if (!letterType || !letterType.isActive) {
          throw new Error("信件类型无效");
        }

        if (school.code !== "WHU" && letterType.code === "HX") {
          throw new Error("仅武汉大学支持中小学生回信");
        }

        const codes = await generateSubmissionCodes(tx, school.id, letterType.id);

        const submission = await tx.submission.create({
          data: {
            schoolId: school.id,
            boothId: booth.id,
            letterTypeId: letterType.id,
            senderName: data.senderName,
            studentId: data.studentId,
            phone: data.phone,
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
        schoolName: result.school.name,
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
