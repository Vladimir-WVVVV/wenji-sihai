import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
> &
  Prisma.TransactionClient;

export async function generateSubmissionCodes(
  tx: TxClient,
  campusId: number,
  letterTypeId: number,
) {
  const campus = await tx.campus.findUnique({
    where: { id: campusId },
    select: {
      id: true,
      code: true,
      name: true,
      hasBooth: true,
      isEnabled: true,
      deletedAt: true,
      school: { select: { id: true, code: true, name: true } },
    },
  });

  const letterType = await tx.letterType.findUnique({
    where: { id: letterTypeId },
    select: { id: true, code: true, name: true },
  });

  if (!campus || !letterType) {
    throw new Error("校区或信件类型无效");
  }

  if (!campus.hasBooth) {
    throw new Error("非摆点校区不参与编号计数");
  }

  if (!campus.isEnabled || campus.deletedAt) {
    throw new Error("活动校区已停用或已归档");
  }

  const scopeRows = await tx.$queryRaw<
    Array<{ id: number; current_value: number }>
  >`SELECT id, current_value FROM counter_scopes WHERE campus_id = ${campusId} AND letter_type_id = ${letterTypeId} FOR UPDATE`;

  const scope = scopeRows[0];
  if (!scope) {
    throw new Error("未找到该活动校区的编号计数器，请联系管理员初始化");
  }

  const nextValue = scope.current_value + 1;

  await tx.counterScope.update({
    where: { id: scope.id },
    data: { currentValue: nextValue },
  });

  const serial = String(nextValue).padStart(3, "0");
  const displaySchoolCampus = `${campus.school.name}（${campus.name}）`;
  return {
    serial,
    displayCode: `${displaySchoolCampus}-${letterType.name}-${serial}`,
    rawCode: `${campus.school.code}-${campus.code}-${letterType.code}-${serial}`,
  };
}
