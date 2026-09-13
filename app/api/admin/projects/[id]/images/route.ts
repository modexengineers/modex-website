import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";

const BUCKET = "website-projects";

function safeName(name: string) {
  const clean = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "");
  return clean || "project-image.jpg";
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Image must be under 15 MB." }, { status: 400 });

    const db = getPortalDb();
    const path = `${id}/${Date.now()}-${randomUUID().slice(0, 8)}-${safeName(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    const { data: publicData } = db.storage.from(BUCKET).getPublicUrl(path);
    const { count } = await db.from("website_project_images").select("id", { count: "exact", head: true }).eq("project_id", id);
    const isFirst = (count || 0) === 0;

    const { data, error } = await db.from("website_project_images").insert({
      project_id: id,
      storage_path: path,
      image_url: publicData.publicUrl,
      image_type: String(form.get("image_type") || "Exterior"),
      caption: String(form.get("caption") || "").trim() || null,
      is_cover: isFirst,
      display_order: count || 0,
    }).select("*").single();
    if (error) {
      await db.storage.from(BUCKET).remove([path]);
      throw error;
    }

    if (isFirst) await db.from("website_projects").update({ cover_image_url: publicData.publicUrl }).eq("id", id);
    return NextResponse.json({ image: data }, { status: 201 });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unable to upload image.";
    return NextResponse.json({ error: message === "UNAUTHORIZED" ? "Admin sign-in required." : "Unable to upload image." }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
