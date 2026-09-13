import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const amount = Number(body?.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Enter a valid payment amount." }, { status: 400 });
    const db = getPortalDb();
    const { data, error } = await db.from("portal_payments").insert({
      project_id: id,
      payment_date: body?.payment_date,
      amount,
      method: String(body?.method || "").trim() || null,
      note: String(body?.note || "").trim() || null,
    }).select("*").single();
    if (error) throw error;
    await db.from("portal_projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ payment: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to record payment." }, { status: 500 });
  }
}
