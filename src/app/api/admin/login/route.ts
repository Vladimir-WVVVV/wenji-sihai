import { NextRequest, NextResponse } from "next/server";

import { findAdminAccount } from "@/config/admins";
import { createAdminToken } from "@/lib/auth-core";
import { appendAuthCookie } from "@/lib/auth";
import { fail } from "@/lib/response";
import { adminLoginSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = adminLoginSchema.safeParse(payload);

  if (!parsed.success) {
    return fail("请输入正确的用户名和密码");
  }

  const account = findAdminAccount(parsed.data.username);
  if (!account || account.password !== parsed.data.password) {
    return fail("用户名或密码错误", 401);
  }

  const token = await createAdminToken(account);
  const response = NextResponse.json({
    success: true,
    message: "登录成功",
    data: {
      username: account.username,
      role: account.role,
      schoolCode: account.schoolCode,
      schoolName: account.schoolName,
    },
  });

  appendAuthCookie(response, token);
  return response;
}
