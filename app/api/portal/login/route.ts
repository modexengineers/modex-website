import { NextResponse } from "next/server";
import { setPortalSession } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const mode = body?.mode === "client" ? "client" : "admin";
    const code = String(body?.code || "").trim();

    if (!code) return NextResponse.json({ error: "Enter your access code." }, { status: 400 });

    if (mode === "admin") {
      const expected = process.env.MODEX_ADMIN_PASSCODE;
      if (!expected || code !== expected) {
        return NextResponse.json({ error: "Incorrect admin passcode." }, { status: 401 });
      }
      await setPortalSession({ role: "admin" });
      return NextResponse.json({ ok: true, role: "admin" });
    }

    const db = getPortalDb();
    const { data, error } = await db
      .from("portal_projects")
      .select("id")
      .eq("access_code", code.toUpperCase())
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Project code not found." }, { status: 401 });

    await setPortalSession({ role: "client", projectId: data.id });
    return NextResponse.json({ ok: true, role: "client", projectId: data.id });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sign in. Check the portal configuration." }, { status: 500 });
  }
}
