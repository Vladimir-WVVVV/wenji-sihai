import { ADMIN_ROLES } from "@/config/constants";

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

export type AdminAccount = {
  username: string;
  password: string;
  role: AdminRole;
  schoolCode: string | null;
  schoolName: string | null;
  enabled: boolean;
  note?: string;
};

export const ADMIN_ACCOUNTS: AdminAccount[] = [
  {
    username: "admin_whu",
    password: "Wenji2026WHU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "WHU",
    schoolName: "武汉大学",
    enabled: true,
  },
  {
    username: "admin_sjtu",
    password: "Wenji2026SJTU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "SJTU",
    schoolName: "上海交通大学",
    enabled: true,
  },
  {
    username: "admin_xmu",
    password: "Wenji2026XMU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "XMU",
    schoolName: "厦门大学",
    enabled: true,
  },
  {
    username: "admin_jlu",
    password: "Wenji2026JLU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "JLU",
    schoolName: "吉林大学",
    enabled: true,
  },
  {
    username: "admin_tju",
    password: "Wenji2026TJU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "TJU",
    schoolName: "天津大学",
    enabled: true,
  },
  {
    username: "admin_seu",
    password: "Wenji2026SEU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "SEU",
    schoolName: "东南大学",
    enabled: true,
  },
  {
    username: "admin_xjtu",
    password: "Wenji2026XJTU",
    role: ADMIN_ROLES.SCHOOL_ADMIN,
    schoolCode: "XJTU",
    schoolName: "西安交通大学",
    enabled: true,
  },
  {
    username: "admin_super",
    password: "Wenji2026SUPER",
    role: ADMIN_ROLES.SUPER_ADMIN,
    schoolCode: null,
    schoolName: null,
    enabled: true,
    note: "测试用，可选启用",
  },
];

export function findAdminAccount(username: string) {
  return ADMIN_ACCOUNTS.find((item) => item.username === username && item.enabled);
}
