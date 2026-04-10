import { PrismaClient } from "@prisma/client";



import {

  LETTER_TYPE_OPTIONS,

  SCHOOL_OPTIONS,

  WHU_CAMPUS_SEED,

  WUHAN_DEFAULT_BOOTHS,

} from "../src/config/constants";



const prisma = new PrismaClient();



async function ensureLetterTypes() {

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

}



async function ensureSchools() {

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

}



async function ensureCampusesAndCountersForSchool(

  schoolCode: string,

  campusDefs: readonly { code: string; name: string; hasBooth: boolean }[],

) {

  const school = await prisma.school.findUniqueOrThrow({ where: { code: schoolCode } });

  const letterTypes = await prisma.letterType.findMany({

    where: {

      isActive: true,

      code: { in: LETTER_TYPE_OPTIONS.map((item) => item.code) },

    },

  });



  for (let i = 0; i < campusDefs.length; i++) {

    const def = campusDefs[i];

    await prisma.campus.upsert({

      where: {

        schoolId_code: { schoolId: school.id, code: def.code },

      },

      update: {

        name: def.name,

        hasBooth: def.hasBooth,

        sortOrder: i,

        isEnabled: true,

        deletedAt: null,

      },

      create: {

        schoolId: school.id,

        code: def.code,

        name: def.name,

        hasBooth: def.hasBooth,

        sortOrder: i,

        isEnabled: true,

      },

    });

  }



  const campuses = await prisma.campus.findMany({

    where: { schoolId: school.id, deletedAt: null },

  });



  for (const campus of campuses) {

    if (!campus.hasBooth) {

      continue;

    }

    for (const letterType of letterTypes) {

      const exists = await prisma.counterScope.findFirst({

        where: { campusId: campus.id, letterTypeId: letterType.id },

      });

      if (!exists) {

        await prisma.counterScope.create({

          data: {

            campusId: campus.id,

            letterTypeId: letterType.id,

            currentValue: 0,

          },

        });

      }

    }

  }

}



async function ensureWhuBoothsOnMainCampus() {

  const whu = await prisma.school.findUniqueOrThrow({ where: { code: "WHU" } });

  const main = await prisma.campus.findUniqueOrThrow({

    where: { schoolId_code: { schoolId: whu.id, code: "MAIN" } },

  });



  for (const boothName of WUHAN_DEFAULT_BOOTHS) {

    await prisma.booth.upsert({

      where: {

        campusId_name: {

          campusId: main.id,

          name: boothName,

        },

      },

      update: {

        schoolId: whu.id,

      },

      create: {

        campusId: main.id,

        schoolId: whu.id,

        name: boothName,

        isActive: true,

      },

    });

  }

}



async function main() {

  await ensureLetterTypes();

  await ensureSchools();



  for (const school of SCHOOL_OPTIONS) {

    if (school.code === "WHU") {

      await ensureCampusesAndCountersForSchool("WHU", WHU_CAMPUS_SEED);

    } else {

      await ensureCampusesAndCountersForSchool(school.code, [

        { code: "MAIN", name: "主校区", hasBooth: true },

      ]);

    }

  }



  await ensureWhuBoothsOnMainCampus();

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

