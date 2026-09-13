import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

const BUCKET = "website-projects";

export async function PATCH(request: Request, { params }: { params: Promise<{ imageId: string }> }) {
  try {
    await requireAdmin();
    const { imageId } = await params;
    const body = await request.json();
    const db = getPortalDb();
    const { data: image, error: findError } = await db.from("website_project_images").select("*").eq("id", imageId).single();
    if (findError || !image) return NextResponse.json({ error: "Image not found." }, { status: 404 });

    if (body.is_cover === true) {
      await db.from("website_project_images").update({ is_cover: false }).eq("project_id", image.project_id);
      const { error } = await db.from("website_project_images").update({ is_cover: true }).eq("id", imageId);
      if (error) throw error;
      await db.from("website_projects").update({ cover_image_url: image.image_url, updated_at: new Date().toISOString() }).eq("id", image.project_id);
    }

    const patch: Record<string, unknown> = {};
    if (typeof body.caption === "string") patch.caption = body.caption.trim() || null;
    if (typeof body.image_type === "string") patch.image_type = body.image_type;
    if (Number.isFinite(Number(body.display_order))) patch.display_order = Number(body.display_order);
    if (Object.keys(patch).length) await db.from("website_project_images").update(patch).eq("id", imageId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to update image.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to update image." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ imageId: string }> }) {
  try {
    await requireAdmin();
    const { imageId } = await params;
    const db = getPortalDb();
    const { data: image, error: findError } = await db.from("website_project_images").select("*").eq("id", imageId).single();
    if (findError || !image) return NextResponse.json({ error: "Image not found." }, { status: 404 });

    await db.storage.from(BUCKET).remove([image.storage_path]);
    const { error } = await db.from("website_project_images").delete().eq("id", imageId);
    if (error) throw error;

    if (image.is_cover) {
      const { data: next } = await db.from("website_project_images").select("*").eq("project_id", image.project_id).order("display_order", { ascending: true }).limit(1).maybeSingle();
      if (next) {
        await db.from("website_project_images").update({ is_cover: true }).eq("id", next.id);
        await db.from("website_projects").update({ cover_image_url: next.image_url }).eq("id", image.project_id);
      } else {
        await db.from("website_projects").update({ cover_image_url: null }).eq("id", image.project_id);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to delete image.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to delete image." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
