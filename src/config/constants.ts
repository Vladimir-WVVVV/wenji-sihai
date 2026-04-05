export const SCHOOL_OPTIONS = [
  { code: "WHU", name: "武汉大学", supportsReply: true },
  { code: "SJTU", name: "上海交通大学", supportsReply: false },
  { code: "XMU", name: "厦门大学", supportsReply: false },
  { code: "JLU", name: "吉林大学", supportsReply: false },
  { code: "TJU", name: "天津大学", supportsReply: false },
  { code: "SEU", name: "东南大学", supportsReply: false },
] as const;

export const LETTER_TYPE_OPTIONS = [
  { code: "DX", name: "定向寄信" },
  { code: "BDX", name: "不定向寄信" },
  { code: "HX", name: "中小学生回信" },
] as const;

export const SUBMISSION_STATUS_OPTIONS = [
  { code: "SUBMITTED", name: "已提交" },
  { code: "RECEIVED", name: "已收实体信" },
  { code: "VERIFIED", name: "已核验" },
  { code: "SORTED", name: "已按校分拣" },
  { code: "SENT", name: "已寄出" },
  { code: "COMPLETED", name: "已完成分发" },
] as const;

export const WUHAN_DEFAULT_BOOTHS = [
  "梅园食堂",
  "桂园食堂",
  "湖滨食堂",
  "工学部一食堂",
  "信息学部图书馆",
] as const;

export const SCHOOL_CODE_TO_NAME = Object.fromEntries(
  SCHOOL_OPTIONS.map((item) => [item.code, item.name]),
) as Record<string, string>;

export const LETTER_TYPE_CODE_TO_NAME = Object.fromEntries(
  LETTER_TYPE_OPTIONS.map((item) => [item.code, item.name]),
) as Record<string, string>;

export const STATUS_CODE_TO_NAME = Object.fromEntries(
  SUBMISSION_STATUS_OPTIONS.map((item) => [item.code, item.name]),
) as Record<string, string>;

export const SCHOOL_NAME_TO_CODE = Object.fromEntries(
  SCHOOL_OPTIONS.map((item) => [item.name, item.code]),
) as Record<string, string>;

export const LETTER_TYPE_NAME_TO_CODE = Object.fromEntries(
  LETTER_TYPE_OPTIONS.map((item) => [item.name, item.code]),
) as Record<string, string>;

export const QUERY_METHOD_OPTIONS = [
  { value: "phone", label: "手机号" },
  { value: "studentId", label: "学号" },
  { value: "namePhoneSuffix", label: "姓名 + 手机号后四位" },
] as const;

export const ADMIN_ROLES = {
  SCHOOL_ADMIN: "school_admin",
  SUPER_ADMIN: "super_admin",
} as const;

export const ADMIN_COOKIE_NAME = "wenji_admin_token";
