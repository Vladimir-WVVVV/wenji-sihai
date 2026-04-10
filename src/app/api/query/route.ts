import { NextRequest } from "next/server";

import { getStudentQueryResults } from "@/lib/db";
import { ok, fail } from "@/lib/response";
import { querySchema } from "@/lib/validators";

function activityCampusLabel(item: {
  school: { name: string };
  activityCampus: { name: string } | null;
}) {
  if (item.activityCampus) {
    return `${item.school.name}（${item.activityCampus.name}）`;
  }
  return "—（历史记录）";
}

function recipientSchoolName(item: {
  letterType: { code: string };
  recipientSchool: { name: string } | null;
}) {
  if (item.letterType.code === "BDX") {
    return "—";
  }
  return item.recipientSchool?.name ?? "—";
}

function recipientCampusName(item: {
  letterType: { code: string };
  recipientCampus: { name: string } | null;
}) {
  if (item.letterType.code === "BDX") {
    return "—";
  }
  return item.recipientCampus?.name ?? "—（历史记录）";
}

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
      rawCode: item.rawCode,
      activitySchoolName: item.school.name,
      activityCampusLabel: activityCampusLabel(item),
      recipientSchoolName: recipientSchoolName(item),
      recipientCampusName: recipientCampusName(item),
      /// 兼容旧前端：活动登记学校
      schoolName: item.school.name,
      /// 兼容旧前端：收信「学校（校区）」合一展示
      recipientCampusLabel:
        item.recipientCampus != null
          ? `${item.recipientSchool?.name ?? item.recipientCampus.school.name}（${item.recipientCampus.name}）`
          : "—",
      boothName: item.booth.name,
      senderName: item.senderName,
      letterTypeName: item.letterType.name,
      status: item.status,
      createdAt: item.createdAt,
    })),
  );
}
