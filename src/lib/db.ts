import { Prisma, SubmissionStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  canAccessSubmissionRecord,
  normalizeSchoolFilter,
  type AdminSession,
  isSuperAdmin,
} from "@/lib/permissions";
import { LETTER_TYPE_OPTIONS, STATUS_CODE_TO_NAME } from "@/config/constants";

type RecordFilters = {
  schoolCode?: string;
  boothId?: number;
  activityCampusId?: number;
  recipientCampusId?: number;
  letterTypeCode?: string;
  status?: SubmissionStatus;
  senderName?: string;
  studentId?: string;
  displayCode?: string;
  createdFrom?: Date;
  createdTo?: Date;
  sort?: "asc" | "desc";
};

const ACTIVE_LETTER_TYPE_CODES = LETTER_TYPE_OPTIONS.map((item) => item.code);
const ACTIVE_SCHOOL_WHERE = {
  isActive: true,
  deletedAt: null,
} as const;

const submissionInclude = {
  school: true,
  activityCampus: { include: { school: true } },
  recipientSchool: true,
  recipientCampus: { include: { school: true } },
  booth: true,
  letterType: true,
} as const;

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

function normalizeCampusId(value: number | undefined) {
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

/** 与学校相关的提交条数：活动登记在本校 或 收信学校为本校（方案 B 统计口径） */
export async function countSubmissionsInvolvingSchool(schoolId: number) {
  return prisma.submission.count({
    where: {
      OR: [{ schoolId }, { recipientSchoolId: schoolId }],
    },
  });
}

export async function getBootstrapData() {
  const schools = await prisma.school.findMany({
    where: ACTIVE_SCHOOL_WHERE,
    orderBy: { id: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
      campuses: {
        where: {
          isEnabled: true,
          deletedAt: null,
        },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          code: true,
          name: true,
          hasBooth: true,
          booths: {
            where: {
              isActive: true,
              deletedAt: null,
              campusId: { not: null },
            },
            orderBy: { id: "asc" },
            select: {
              id: true,
              name: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  const activityCampuses = schools.flatMap((school) =>
    school.campuses
      .filter((campus) => campus.hasBooth)
      .map((campus) => ({
        id: campus.id,
        schoolId: school.id,
        schoolCode: school.code,
        schoolName: school.name,
        campusCode: campus.code,
        campusName: campus.name,
        displayLabel: `${school.name}（${campus.name}）`,
        booths: campus.booths,
      })),
  );

  const recipientSchools = schools.map((school) => ({
    id: school.id,
    code: school.code,
    name: school.name,
    campuses: school.campuses.map((campus) => ({
      id: campus.id,
      code: campus.code,
      name: campus.name,
      hasBooth: campus.hasBooth,
    })),
  }));

  return { activityCampuses, recipientSchools };
}

export async function getStudentQueryResults(input: {
  mode: "phone" | "studentId" | "namePhoneSuffix";
  phone?: string;
  studentId?: string;
  senderName?: string;
  phoneSuffix?: string;
}) {
  const where: Prisma.SubmissionWhereInput = {
    letterType: { code: { in: ACTIVE_LETTER_TYPE_CODES } },
  };

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
    include: submissionInclude,
  });
}

export async function getAdminDashboardStats(session: AdminSession) {
  const schoolCode = normalizeSchoolFilter(session);
  const school = schoolCode
    ? await prisma.school.findUnique({ where: { code: schoolCode } })
    : null;

  const activeTypeWhere: Prisma.SubmissionWhereInput = {
    letterType: { code: { in: ACTIVE_LETTER_TYPE_CODES } },
  };

  /// 方案 B：活动在本校 或 收信学校为本校（不认仅靠收信校区推断，避免旧数据误扩权）
  const scopeWhere: Prisma.SubmissionWhereInput | undefined = school
    ? {
        OR: [{ schoolId: school.id }, { recipientSchoolId: school.id }],
      }
    : undefined;

  const baseWhere: Prisma.SubmissionWhereInput = scopeWhere
    ? { AND: [scopeWhere, activeTypeWhere] }
    : activeTypeWhere;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const total = await prisma.submission.count({ where: baseWhere });
  const directed = await prisma.submission.count({
    where: scopeWhere
      ? { AND: [scopeWhere, { letterType: { code: "DX" } }] }
      : { letterType: { code: "DX" } },
  });
  const random = await prisma.submission.count({
    where: scopeWhere
      ? { AND: [scopeWhere, { letterType: { code: "BDX" } }] }
      : { letterType: { code: "BDX" } },
  });
  const today = await prisma.submission.count({
    where: scopeWhere
      ? { AND: [scopeWhere, activeTypeWhere, { createdAt: { gte: todayStart } }] }
      : { AND: [activeTypeWhere, { createdAt: { gte: todayStart } }] },
  });

  return { total, directed, random, today, school };
}

export async function getAdminRecords(session: AdminSession, filters: RecordFilters) {
  const normalizedSchoolCode = normalizeSchoolFilter(
    session,
    normalizeOptionalString(filters.schoolCode),
  );
  const normalizedBoothId = normalizeBoothId(filters.boothId);
  const normalizedActivityCampusId = normalizeCampusId(filters.activityCampusId);
  const normalizedRecipientCampusId = normalizeCampusId(filters.recipientCampusId);
  const normalizedLetterTypeCode = ACTIVE_LETTER_TYPE_CODES.includes(
    normalizeOptionalString(filters.letterTypeCode) as (typeof ACTIVE_LETTER_TYPE_CODES)[number],
  )
    ? normalizeOptionalString(filters.letterTypeCode)
    : undefined;
  const normalizedStatus = normalizeStatus(filters.status);
  const normalizedSenderName = normalizeOptionalString(filters.senderName, true);
  const normalizedStudentId = normalizeOptionalString(filters.studentId, true);
  const normalizedDisplayCode = normalizeOptionalString(filters.displayCode, true);
  const normalizedCreatedFrom = normalizeDate(filters.createdFrom);
  const normalizedCreatedTo = normalizeDate(filters.createdTo);

  const andParts: Prisma.SubmissionWhereInput[] = [
    { letterType: { code: { in: ACTIVE_LETTER_TYPE_CODES } } },
  ];

  if (normalizedSchoolCode && !isSuperAdmin(session)) {
    andParts.push({
      OR: [
        { school: { code: normalizedSchoolCode } },
        { recipientSchool: { code: normalizedSchoolCode } },
      ],
    });
  }

  if (normalizedSchoolCode && isSuperAdmin(session)) {
    andParts.push({ school: { code: normalizedSchoolCode } });
  }

  if (normalizedBoothId) {
    andParts.push({ boothId: normalizedBoothId });
  }

  if (normalizedActivityCampusId) {
    andParts.push({ activityCampusId: normalizedActivityCampusId });
  }

  if (normalizedRecipientCampusId) {
    andParts.push({ recipientCampusId: normalizedRecipientCampusId });
  }

  if (normalizedLetterTypeCode) {
    andParts.push({ letterType: { code: normalizedLetterTypeCode } });
  }

  if (normalizedStatus) {
    andParts.push({ status: normalizedStatus });
  }

  if (normalizedSenderName) {
    andParts.push({
      senderName: { contains: normalizedSenderName, mode: "insensitive" },
    });
  }

  if (normalizedStudentId) {
    andParts.push({
      studentId: { contains: normalizedStudentId, mode: "insensitive" },
    });
  }

  if (normalizedDisplayCode) {
    andParts.push({
      displayCode: { contains: normalizedDisplayCode, mode: "insensitive" },
    });
  }

  if (normalizedCreatedFrom || normalizedCreatedTo) {
    andParts.push({
      createdAt: {
        ...(normalizedCreatedFrom ? { gte: normalizedCreatedFrom } : {}),
        ...(normalizedCreatedTo ? { lte: normalizedCreatedTo } : {}),
      },
    });
  }

  const where: Prisma.SubmissionWhereInput =
    andParts.length === 1 ? andParts[0] : { AND: andParts };

  return prisma.submission.findMany({
    where,
    orderBy: { createdAt: filters.sort === "asc" ? "asc" : "desc" },
    include: submissionInclude,
  });
}

export async function getAdminRecordById(session: AdminSession, id: number) {
  const record = await prisma.submission.findUnique({
    where: { id },
    include: submissionInclude,
  });

  if (!record) {
    return null;
  }

  if (!canAccessSubmissionRecord(session, record)) {
    return null;
  }

  if (!ACTIVE_LETTER_TYPE_CODES.includes(record.letterType.code as (typeof ACTIVE_LETTER_TYPE_CODES)[number])) {
    return null;
  }

  return record;
}

export async function getBoothsForAdmin(session: AdminSession) {
  const schoolCode = normalizeSchoolFilter(session);

  const schoolFilter = schoolCode
    ? { ...ACTIVE_SCHOOL_WHERE, code: schoolCode }
    : ACTIVE_SCHOOL_WHERE;

  return prisma.booth.findMany({
    where: {
      OR: [
        { campus: { school: schoolFilter } },
        { schoolId: { not: null }, school: schoolFilter },
      ],
    },
    include: {
      campus: {
        include: {
          school: true,
        },
      },
      school: true,
    },
    orderBy: [{ id: "asc" }],
  });
}

export function mapRecordToCsvRow(
  record: Awaited<ReturnType<typeof getAdminRecords>>[number],
) {
  const activityLabel = record.activityCampus
    ? `${record.activityCampus.school.name}（${record.activityCampus.name}）`
    : "—（历史记录）";
  const recipientSchoolName =
    record.letterType.code === "BDX" ? "—" : (record.recipientSchool?.name ?? "—");
  const recipientCampusName =
    record.letterType.code === "BDX"
      ? "—"
      : (record.recipientCampus?.name ?? "—（历史记录）");

  return {
    展示编号: record.displayCode,
    内部短码: record.rawCode,
    活动学校: record.school.name,
    活动校区: activityLabel,
    收信学校: recipientSchoolName,
    收信校区: recipientCampusName,
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
