import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

const categories = new Set(["Material", "Labour", "Food", "Rent", "Others", "Service Charge"]);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    await requireAdmin();
    const body = await request.json();
    const category = String(body?.category || "");
    const amount = Number(body?.amount || 0);
    const particular = String(body?.particular || "").trim();
    if (!categories.has(category) || !particular || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a valid category, particular and amount." }, { status: 400 });
    }
    const db = getPortalDb();
    const { data, error } = await db.from("portal_entries").insert({
      project_id: id,
      entry_date: body?.entry_date,
      category,
      particular,
      quantity: String(body?.quantity || "").trim() || null,
      amount,
      remarks: String(body?.remarks || "").trim() || null,
    }).select("*").single();
    if (error) throw error;
    await db.from("portal_projects").update({ updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to add entry." }, { status: 500 });
  }
}
