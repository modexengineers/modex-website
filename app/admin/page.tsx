import AdminApp from "@/components/admin/AdminApp";
import AdminLogin from "@/components/admin/AdminLogin";
import { getPortalSession } from "@/lib/portal-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getPortalSession();
  if (!session || session.role !== "admin") return <AdminLogin />;
  return <AdminApp />;
}
