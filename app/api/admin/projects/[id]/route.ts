import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

function text(value: unknown) { return String(value ?? "").trim(); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const title = text(body.title);
    const slug = slugify(text(body.slug) || title);
    if (!title || !slug) return NextResponse.json({ error: "Project name and URL slug are required." }, { status: 400 });

    const db = getPortalDb();
    const { data, error } = await db.from("website_projects").update({
      title,
      slug,
      location: text(body.location) || null,
      category: text(body.category) || "Residential",
      status: text(body.status) || "Ongoing",
      year: text(body.year) || null,
      area: text(body.area) || null,
      short_description: text(body.short_description) || null,
      description: text(body.description) || null,
      services: Array.isArray(body.services) ? body.services.map(text).filter(Boolean) : [],
      featured: Boolean(body.featured),
      display_order: Number(body.display_order) || 0,
      updated_at: new Date().toISOString(),
    }).eq("id", id).select("*").single();

    if (error) {
      if ((error as any).code === "23505") return NextResponse.json({ error: "That project URL slug is already in use." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ project: data });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to update project.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to update project." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const db = getPortalDb();
    const { data: images } = await db.from("website_project_images").select("storage_path").eq("project_id", id);
    const paths = (images || []).map((image: any) => image.storage_path).filter(Boolean);
    if (paths.length) await db.storage.from("website-projects").remove(paths);
    const { error } = await db.from("website_projects").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to delete project.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to delete project." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
