import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await context.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const patch = {
      entry_date: body.entry_date,
      category: body.category,
      particular: String(body.particular || "").trim(),
      quantity: String(body.quantity || "").trim() || null,
      amount: Number(body.amount || 0),
      remarks: String(body.remarks || "").trim() || null,
    };
    const db = getPortalDb();
    const { data, error } = await db.from("portal_entries").update(patch).eq("id", entryId).eq("project_id", id).select("*").single();
    if (error) throw error;
    await db.from("portal_projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ entry: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update entry." }, { status: 500 });
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string; entryId: string }> }) {
  const { id, entryId } = await context.params;
  try {
    await requireAdmin();
    const db = getPortalDb();
    const { error } = await db.from("portal_entries").delete().eq("id", entryId).eq("project_id", id);
    if (error) throw error;
    await db.from("portal_projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete entry." }, { status: 500 });
  }
}
