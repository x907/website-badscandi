import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { AdminOrdersClient } from "@/components/admin-orders-client";

export default async function AdminOrdersPage() {
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/");
  }

  return <AdminOrdersClient />;
}
