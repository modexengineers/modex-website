import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

function text(value: unknown) { return String(value ?? "").trim(); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET() {
  try {
    await requireAdmin();
    const db = getPortalDb();
    const { data, error } = await db
      .from("website_projects")
      .select("*, website_project_images(*)")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    const projects = (data || []).map((project: any) => ({
      ...project,
      website_project_images: (project.website_project_images || []).sort((a: any, b: any) => a.display_order - b.display_order),
    }));
    return NextResponse.json({ projects });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to load projects.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to load projects." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const title = text(body.title);
    if (!title) return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    const slug = slugify(text(body.slug) || title);
    if (!slug) return NextResponse.json({ error: "A valid project slug is required." }, { status: 400 });

    const db = getPortalDb();
    const { data, error } = await db.from("website_projects").insert({
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
    }).select("*").single();

    if (error) {
      if ((error as any).code === "23505") return NextResponse.json({ error: "That project URL slug is already in use." }, { status: 409 });
      throw error;
    }
    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to create project.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to create project." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
