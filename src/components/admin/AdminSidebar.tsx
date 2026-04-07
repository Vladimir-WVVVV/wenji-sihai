"use client";

import { usePathname } from "next/navigation";

import { isSuperAdmin, type AdminSession } from "@/lib/permissions";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";
import { cn } from "@/lib/utils";

type Props = {
  session: AdminSession;
};

const NAV_ITEMS = [
  { href: "/admin", label: "后台首页" },
  { href: "/admin/records", label: "记录列表" },
  { href: "/admin/booths", label: "摊位管理" },
];
const SCHOOL_NAV_ITEM = {
  href: "/admin/schools",
  label: "学校管理",
};

export function AdminSidebar({ session }: Props) {
  const currentPath = usePathname();
  const navItems = isSuperAdmin(session)
    ? [...NAV_ITEMS, SCHOOL_NAV_ITEM]
    : NAV_ITEMS;

  return (
    <aside className="card flex w-full flex-col gap-4 p-5 lg:w-64">
      <div>
        <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
          文寄四海
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">后台管理</h2>
        <p className="mt-1 text-sm text-slate-600">
          {session.schoolName || "全部学校"}
        </p>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm transition",
              currentPath === item.href ||
                (item.href !== "/admin" && currentPath.startsWith(item.href))
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl bg-slate-50 p-3 text-xs leading-6 text-slate-500">
          <div>账号：{session.username}</div>
          <div>权限：{session.role === "super_admin" ? "超级管理员" : "高校管理员"}</div>
        </div>
        <AdminLogoutButton />
      </div>
    </aside>
  );
}
