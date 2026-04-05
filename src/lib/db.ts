import { Prisma, SubmissionStatus } from "@prisma/client";
import { unstable_cache } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  canAccessSchool,
  normalizeSchoolFilter,
  type AdminSession,
} from "@/lib/permissions";
import { STATUS_CODE_TO_NAME } from "@/config/constants";

type RecordFilters = {
  schoolCode?: string;
  boothId?: number;
  letterTypeCode?: string;
  status?: SubmissionStatus;
  senderName?: string;
  studentId?: string;
  displayCode?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sort?: "asc" | "desc";
};

function normalizeOptionalString(value: string | undefined, trim = false) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = trim ? value.trim() : value;
  return normalized ? normalized : undefined;
}

function normalizeBoothId(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }

  return value;
}

function normalizeStatus(value: SubmissionStatus | undefined) {
  if (!value || !Object.values(SubmissionStatus).includes(value)) {
    return undefined;
  }

  return value;
}

function normalizeDate(value: Date | undefined) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return undefined;
  }

  return value;
}

const getBootstrapDataCached = unstable_cache(
  async () => {
    const schools = await prisma.school.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        booths: {
          where: { isActive: true },
          orderBy: { id: "asc" },
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    return { schools };
  },
  ["bootstrap-data"],
  {
    revalidate: 60,
  },
);

export async function getBootstrapData() {
  return getBootstrapDataCached();
}

export async function getStudentQueryResults(input: {
  mode: "phone" | "studentId" | "namePhoneSuffix";
  phone?: string;
  studentId?: string;
  senderName?: string;
  phoneSuffix?: string;
}) {
  const where: Prisma.SubmissionWhereInput = {};

  if (input.mode === "phone") {
    where.phone = input.phone;
  }

  if (input.mode === "studentId") {
    where.studentId = input.studentId;
  }

  if (input.mode === "namePhoneSuffix") {
    where.senderName = input.senderName;
    where.phone = { endsWith: input.phoneSuffix };
  }

  return prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      school: true,
      booth: true,
      letterType: true,
    },
  });
}

export async function getAdminDashboardStats(session: AdminSession) {
  const schoolCode = normalizeSchoolFilter(session);
  const school = schoolCode
    ? await prisma.school.findUnique({ where: { code: schoolCode } })
    : null;

  const schoolWhere = school ? { schoolId: school.id } : {};
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Session pooler runs with a tight connection limit in local development,
  // so dashboard counts should avoid parallel queries that can exhaust the pool.
  const total = await prisma.submission.count({ where: schoolWhere });
  const directed = await prisma.submission.count({
    where: { ...schoolWhere, letterType: { code: "DX" } },
  });
  const random = await prisma.submission.count({
    where: { ...schoolWhere, letterType: { code: "BDX" } },
  });
  const reply = await prisma.submission.count({
    where: { ...schoolWhere, letterType: { code: "HX" } },
  });
  const today = await prisma.submission.count({
    where: { ...schoolWhere, createdAt: { gte: todayStart } },
  });

  return { total, directed, random, reply, today, school };
}

export async function getAdminRecords(session: AdminSession, filters: RecordFilters) {
  const normalizedSchoolCode = normalizeSchoolFilter(
    session,
    normalizeOptionalString(filters.schoolCode),
  );
  const normalizedBoothId = normalizeBoothId(filters.boothId);
  const normalizedLetterTypeCode = normalizeOptionalString(filters.letterTypeCode);
  const normalizedStatus = normalizeStatus(filters.status);
  const normalizedSenderName = normalizeOptionalString(filters.senderName, true);
  const normalizedStudentId = normalizeOptionalString(filters.studentId, true);
  const normalizedDisplayCode = normalizeOptionalString(filters.displayCode, true);
  const normalizedCreatedFrom = normalizeDate(filters.createdFrom);
  const normalizedCreatedTo = normalizeDate(filters.createdTo);

  const where: Prisma.SubmissionWhereInput = {};

  if (normalizedSchoolCode) {
    where.school = { code: normalizedSchoolCode };
  }

  if (normalizedBoothId) {
    where.boothId = normalizedBoothId;
  }

  if (normalizedLetterTypeCode) {
    where.letterType = { code: normalizedLetterTypeCode };
  }

  if (normalizedStatus) {
    where.status = normalizedStatus;
  }

  if (normalizedSenderName) {
    where.senderName = { contains: normalizedSenderName, mode: "insensitive" };
  }

  if (normalizedStudentId) {
    where.studentId = { contains: normalizedStudentId, mode: "insensitive" };
  }

  if (normalizedDisplayCode) {
    where.displayCode = { contains: normalizedDisplayCode, mode: "insensitive" };
  }

  if (normalizedCreatedFrom || normalizedCreatedTo) {
    where.createdAt = {
      ...(normalizedCreatedFrom ? { gte: normalizedCreatedFrom } : {}),
      ...(normalizedCreatedTo ? { lte: normalizedCreatedTo } : {}),
    };
  }

  return prisma.submission.findMany({
    where,
    orderBy: { createdAt: filters.sort === "asc" ? "asc" : "desc" },
    include: {
      school: true,
      booth: true,
      letterType: true,
    },
  });
}

export async function getAdminRecordById(session: AdminSession, id: number) {
  const record = await prisma.submission.findUnique({
    where: { id },
    include: {
      school: true,
      booth: true,
      letterType: true,
    },
  });

  if (!record) {
    return null;
  }

  if (!canAccessSchool(session, record.school.code)) {
    return null;
  }

  return record;
}

export async function getBoothsForAdmin(session: AdminSession) {
  const schoolCode = normalizeSchoolFilter(session);

  return prisma.booth.findMany({
    where: {
      school: schoolCode ? { code: schoolCode } : undefined,
    },
    include: {
      school: true,
    },
    orderBy: [{ schoolId: "asc" }, { id: "asc" }],
  });
}

export function mapRecordToCsvRow(
  record: Awaited<ReturnType<typeof getAdminRecords>>[number],
) {
  return {
    编号: record.displayCode,
    学校: record.school.name,
    摊位: record.booth.name,
    寄件人姓名: record.senderName,
    学号: record.studentId,
    寄信人联系方式: record.phone,
    寄信人住址: record.senderAddress ?? "",
    信件类型: record.letterType.name,
    当前状态: STATUS_CODE_TO_NAME[record.status],
    提交时间: record.createdAt.toLocaleString("zh-CN"),
  };
}
