import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdminSession } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <main className="page-shell py-6 lg:py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar session={session} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
