import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth-utils";
import { AdminReviewsClient } from "@/components/admin-reviews-client";

export default async function AdminReviewsPage() {
  // Check if user is admin
  const userIsAdmin = await isAdmin();

  if (!userIsAdmin) {
    redirect("/");
  }

  return <AdminReviewsClient />;
}
