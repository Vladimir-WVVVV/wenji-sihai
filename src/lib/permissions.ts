import { ADMIN_ROLES } from "@/config/constants";

export type AdminSession = {
  username: string;
  role: string;
  schoolCode: string | null;
  schoolName: string | null;
};

export function isSuperAdmin(session: AdminSession | null | undefined) {
  return session?.role === ADMIN_ROLES.SUPER_ADMIN;
}

export function canAccessSchool(
  session: AdminSession | null | undefined,
  schoolCode: string | null | undefined,
) {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  return !!schoolCode && session.schoolCode === schoolCode;
}

/**
 * 方案 B：本校管理员可见
 * - 活动登记在本校（schoolId / school.code）
 * - 或收信学校为本校（recipientSchoolId / recipientSchool.code）
 * 保守策略：缺少 recipientSchoolId 的旧数据不因「仅有收信校区」而扩大可见范围。
 */
export function canAccessSubmissionRecord(
  session: AdminSession | null | undefined,
  record: {
    school: { code: string };
    recipientSchool: { code: string } | null;
  },
) {
  if (!session) return false;
  if (isSuperAdmin(session)) return true;
  const code = session.schoolCode;
  if (!code) return false;
  if (record.school.code === code) return true;
  if (record.recipientSchool?.code === code) return true;
  return false;
}

export function normalizeSchoolFilter(
  session: AdminSession,
  requestedSchoolCode?: string | null,
) {
  if (isSuperAdmin(session)) {
    return requestedSchoolCode || undefined;
  }
  return session.schoolCode || undefined;
}
