import { SubmissionStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getAdminRecords, mapRecordToCsvRow } from "@/lib/db";
import { requireAdminApiSession } from "@/lib/auth";
import { fail } from "@/lib/response";
import { buildCsv } from "@/lib/utils";

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

  const csv = buildCsv(records.map(mapRecordToCsvRow));
  const csvBytes = new TextEncoder().encode(csv);

  return new NextResponse(csvBytes, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        "attachment; filename=\"wenji-sihai-records.csv\"; filename*=UTF-8''wenji-sihai-records.csv",
    },
  });
}
