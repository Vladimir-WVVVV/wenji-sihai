import { SubmissionStatus } from "@prisma/client";
import { NextRequest } from "next/server";

import { getAdminRecords } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail, ok } from "@/lib/response";

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request);
  if (!session) {
    return fail("未登录或登录已过期", 401);
  }

  const { searchParams } = new URL(request.url);
  const records = await getAdminRecords(session, {
    schoolCode: searchParams.get("schoolCode") || undefined,
    boothId: searchParams.get("boothId")
      ? Number(searchParams.get("boothId"))
      : undefined,
    activityCampusId: searchParams.get("activityCampusId")
      ? Number(searchParams.get("activityCampusId"))
      : undefined,
    recipientCampusId: searchParams.get("recipientCampusId")
      ? Number(searchParams.get("recipientCampusId"))
      : undefined,
    letterTypeCode: searchParams.get("letterTypeCode") || undefined,
    status: (searchParams.get("status") as SubmissionStatus | null) || undefined,
    senderName: searchParams.get("senderName") || undefined,
    studentId: searchParams.get("studentId") || undefined,
    displayCode: searchParams.get("displayCode") || undefined,
    createdFrom: searchParams.get("createdFrom")
      ? new Date(searchParams.get("createdFrom") as string)
      : undefined,
    createdTo: searchParams.get("createdTo")
      ? new Date(`${searchParams.get("createdTo")}T23:59:59.999`)
      : undefined,
    sort: searchParams.get("sort") === "asc" ? "asc" : "desc",
  });

  return ok(records);
}
