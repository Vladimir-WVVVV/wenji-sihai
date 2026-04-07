import { PrismaClient } from "@prisma/client";

import {
  LETTER_TYPE_OPTIONS,
  SCHOOL_OPTIONS,
  WUHAN_DEFAULT_BOOTHS,
} from "../src/config/constants";

const prisma = new PrismaClient();

async function main() {
  for (const school of SCHOOL_OPTIONS) {
    await prisma.school.upsert({
      where: { code: school.code },
      update: { name: school.name },
      create: {
        code: school.code,
        name: school.name,
        isActive: true,
      },
    });
  }

  for (const letterType of LETTER_TYPE_OPTIONS) {
    await prisma.letterType.upsert({
      where: { code: letterType.code },
      update: { name: letterType.name, isActive: true },
      create: {
        code: letterType.code,
        name: letterType.name,
        isActive: true,
      },
    });
  }

  const whu = await prisma.school.findUniqueOrThrow({ where: { code: "WHU" } });
  for (const boothName of WUHAN_DEFAULT_BOOTHS) {
    await prisma.booth.upsert({
      where: {
        schoolId_name: {
          schoolId: whu.id,
          name: boothName,
        },
      },
      update: {},
      create: {
        schoolId: whu.id,
        name: boothName,
        isActive: true,
      },
    });
  }

  const schools = await prisma.school.findMany();
  const letterTypes = await prisma.letterType.findMany();

  for (const school of schools) {
    for (const letterType of letterTypes) {
      if (!LETTER_TYPE_OPTIONS.some((item) => item.code === letterType.code)) {
        continue;
      }

      await prisma.counterScope.upsert({
        where: {
          schoolId_letterTypeId: {
            schoolId: school.id,
            letterTypeId: letterType.id,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          letterTypeId: letterType.id,
          currentValue: 0,
        },
      });
    }
  }
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
