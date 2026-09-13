import { NextResponse } from "next/server";
import { requireAdmin, requireProjectAccess } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireProjectAccess(id);
    const db = getPortalDb();
    const [projectRes, entryRes, paymentRes] = await Promise.all([
      db.from("portal_projects").select("*").eq("id", id).single(),
      db.from("portal_entries").select("*").eq("project_id", id).order("entry_date", { ascending: false }).order("created_at", { ascending: false }),
      db.from("portal_payments").select("*").eq("project_id", id).order("payment_date", { ascending: false }).order("created_at", { ascending: false }),
    ]);
    if (projectRes.error) throw projectRes.error;
    if (entryRes.error) throw entryRes.error;
    if (paymentRes.error) throw paymentRes.error;
    return NextResponse.json({ project: projectRes.data, entries: entryRes.data || [], payments: paymentRes.data || [] });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "";
    return NextResponse.json({ error: "Unable to load project." }, { status: message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const allowed = ["name", "client_name", "location", "status", "start_date", "access_code"] as const;
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) if (key in body) patch[key] = key === "access_code" ? String(body[key]).toUpperCase() : body[key];
    const db = getPortalDb();
    const { data, error } = await db.from("portal_projects").update(patch).eq("id", id).select("*").single();
    if (error) throw error;
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update project." }, { status: 500 });
  }
}


export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireAdmin();
    const db = getPortalDb();
    const { error } = await db.from("portal_projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to delete project." }, { status: 500 });
  }
}
