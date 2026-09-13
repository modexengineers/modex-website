import { NextResponse } from "next/server";
import { getPortalSession, requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

function randomCode() {
  return "MX" + Math.random().toString(36).slice(2, 7).toUpperCase();
}

export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const db = getPortalDb();

    let query = db.from("portal_projects").select("*").order("updated_at", { ascending: false });
    if (session.role === "client" && session.projectId) query = query.eq("id", session.projectId);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ projects: data || [] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load projects." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const clientName = String(body?.client_name || "").trim();
    if (!name || !clientName) return NextResponse.json({ error: "Project and client name are required." }, { status: 400 });

    const db = getPortalDb();
    const payload = {
      name,
      client_name: clientName,
      location: String(body?.location || "").trim() || null,
      status: String(body?.status || "Ongoing"),
      start_date: body?.start_date || null,
      access_code: String(body?.access_code || randomCode()).trim().toUpperCase(),
    };

    const { data, error } = await db.from("portal_projects").insert(payload).select("*").single();
    if (error) throw error;
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to create project." }, { status: 500 });
  }
}
