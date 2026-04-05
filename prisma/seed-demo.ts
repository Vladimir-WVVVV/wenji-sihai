import { PrismaClient, SubmissionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const whu = await prisma.school.findUnique({ where: { code: "WHU" } });
  const dx = await prisma.letterType.findUnique({ where: { code: "DX" } });
  const bdx = await prisma.letterType.findUnique({ where: { code: "BDX" } });

  if (!whu || !dx || !bdx) {
    throw new Error("请先执行基础 seed：npm run db:seed");
  }

  const booth = await prisma.booth.findFirst({
    where: { schoolId: whu.id, isActive: true },
  });

  if (!booth) {
    throw new Error("未找到可用摊位");
  }

  await prisma.submission.upsert({
    where: { rawCode: "WHU-DX-900" },
    update: {},
    create: {
      schoolId: whu.id,
      boothId: booth.id,
      letterTypeId: dx.id,
      senderName: "张同学",
      studentId: "20260001",
      phone: "13800000001",
      college: "法学院",
      grade: "2023级",
      recipientName: "李同学",
      recipientPhone: "13800000002",
      recipientAddress: "武汉大学桂园宿舍",
      recipientRemark: "请放前台",
      displayCode: "武汉大学-定向寄信-900",
      rawCode: "WHU-DX-900",
      status: SubmissionStatus.RECEIVED,
    },
  });

  await prisma.submission.upsert({
    where: { rawCode: "WHU-BDX-901" },
    update: {},
    create: {
      schoolId: whu.id,
      boothId: booth.id,
      letterTypeId: bdx.id,
      senderName: "王同学",
      studentId: "20260002",
      phone: "13800000003",
      college: "信息管理学院",
      grade: "2024级",
      freeLetterTopic: "想和陌生朋友聊聊大学里的遗憾与热爱",
      displayCode: "武汉大学-不定向寄信-901",
      rawCode: "WHU-BDX-901",
      status: SubmissionStatus.SUBMITTED,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
