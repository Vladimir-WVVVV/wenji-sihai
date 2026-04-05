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

export function normalizeSchoolFilter(
  session: AdminSession,
  requestedSchoolCode?: string | null,
) {
  if (isSuperAdmin(session)) {
    return requestedSchoolCode || undefined;
  }
  return session.schoolCode || undefined;
}
