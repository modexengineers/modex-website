import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

export async function DELETE(_: Request, context: { params: Promise<{ id: string; paymentId: string }> }) {
  const { id, paymentId } = await context.params;
  try {
    await requireAdmin();
    const db = getPortalDb();
    const { error } = await db.from("portal_payments").delete().eq("id", paymentId).eq("project_id", id);
    if (error) throw error;
    await db.from("portal_projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete payment." }, { status: 500 });
  }
}
