import { Prisma, PrismaClient } from "@prisma/client";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
> &
  Prisma.TransactionClient;

export async function generateSubmissionCodes(
  tx: TxClient,
  schoolId: number,
  letterTypeId: number,
) {
  const school = await tx.school.findUnique({
    where: { id: schoolId },
    select: { id: true, code: true, name: true },
  });

  const letterType = await tx.letterType.findUnique({
    where: { id: letterTypeId },
    select: { id: true, code: true, name: true },
  });

  if (!school || !letterType) {
    throw new Error("学校或信件类型无效");
  }

  const scopeRows = await tx.$queryRaw<
    Array<{ id: number; current_value: number }>
  >`SELECT id, current_value FROM counter_scopes WHERE school_id = ${schoolId} AND letter_type_id = ${letterTypeId} FOR UPDATE`;

  const scope = scopeRows[0];
  if (!scope) {
    throw new Error("未找到编号计数器，请先执行种子数据初始化");
  }

  const nextValue = scope.current_value + 1;

  await tx.counterScope.update({
    where: { id: scope.id },
    data: { currentValue: nextValue },
  });

  const serial = String(nextValue).padStart(3, "0");
  return {
    serial,
    displayCode: `${school.name}-${letterType.name}-${serial}`,
    rawCode: `${school.code}-${letterType.code}-${serial}`,
  };
}
