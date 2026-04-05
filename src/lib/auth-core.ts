import { jwtVerify, SignJWT } from "jose";

import { type AdminAccount } from "@/config/admins";
import { type AdminSession } from "@/lib/permissions";

const secret = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "wenji-sihai-dev-secret",
);

export async function createAdminToken(admin: AdminAccount) {
  return new SignJWT({
    username: admin.username,
    role: admin.role,
    schoolCode: admin.schoolCode,
    schoolName: admin.schoolName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyAdminToken(token?: string | null): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      username: String(payload.username),
      role: String(payload.role),
      schoolCode: payload.schoolCode ? String(payload.schoolCode) : null,
      schoolName: payload.schoolName ? String(payload.schoolName) : null,
    };
  } catch {
    return null;
  }
}
