import { NextRequest } from "next/server";

import { getStudentQueryResults } from "@/lib/db";
import { ok, fail } from "@/lib/response";
import { querySchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const parsed = querySchema.safeParse(payload);

  if (!parsed.success) {
    return fail("查询条件不正确", 400, {
      errors: parsed.error.flatten(),
    });
  }

  const results = await getStudentQueryResults(parsed.data);

  return ok(
    results.map((item) => ({
      id: item.id,
      displayCode: item.displayCode,
      schoolName: item.school.name,
      boothName: item.booth.name,
      senderName: item.senderName,
      letterTypeName: item.letterType.name,
      status: item.status,
      createdAt: item.createdAt,
    })),
  );
}
