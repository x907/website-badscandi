import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
