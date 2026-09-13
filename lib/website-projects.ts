import "server-only";

import { getPortalDb } from "@/lib/portal-db";

export type WebsiteProjectImage = {
  id: string;
  project_id: string;
  storage_path: string;
  image_url: string;
  image_type: string;
  caption: string | null;
  is_cover: boolean;
  display_order: number;
  created_at: string;
};

export type WebsiteProject = {
  id: string;
  title: string;
  slug: string;
  location: string;
  category: string;
  status: string;
  year: string;
  area: string;
  short_description: string;
  description: string;
  services: string[];
  featured: boolean;
  display_order: number;
  cover_image_url: string;
  created_at: string;
  updated_at: string;
  website_project_images: WebsiteProjectImage[];
};

function configured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizeProject(row: any): WebsiteProject {
  const images = [...(row.website_project_images || [])].sort(
    (a: WebsiteProjectImage, b: WebsiteProjectImage) => a.display_order - b.display_order,
  );

  const cover =
    images.find((image: WebsiteProjectImage) => image.is_cover)?.image_url ||
    row.cover_image_url ||
    images[0]?.image_url ||
    "";

  return {
    ...row,
    location: row.location || "Kasaragod, Kerala",
    category: row.category || "Project",
    status: row.status || "Ongoing",
    year: row.year || "",
    area: row.area || "",
    short_description: row.short_description || "",
    description: row.description || row.short_description || "",
    services: Array.isArray(row.services) ? row.services : [],
    featured: Boolean(row.featured),
    display_order: Number(row.display_order) || 0,
    cover_image_url: cover,
    website_project_images: images,
  } as WebsiteProject;
}

/**
 * Public website project loader.
 * IMPORTANT: there is deliberately NO static fallback/demo project data.
 * A project only becomes public after an image has been uploaded in /admin.
 */
export async function getWebsiteProjects(options?: { featuredOnly?: boolean }) {
  if (!configured()) {
    console.warn("Website projects are not available because Supabase is not configured.");
    return [] as WebsiteProject[];
  }

  try {
    const db = getPortalDb();
    let query = db
      .from("website_projects")
      .select("*, website_project_images(*)")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (options?.featuredOnly) query = query.eq("featured", true);

    const { data, error } = await query;
    if (error) throw error;

    return (data || [])
      .map(normalizeProject)
      .filter((project) => project.website_project_images.length > 0 && Boolean(project.cover_image_url));
  } catch (error) {
    console.error("Unable to load public website projects:", error);
    return [] as WebsiteProject[];
  }
}

export async function getWebsiteProjectBySlug(slug: string) {
  if (!configured()) return null;

  try {
    const db = getPortalDb();
    const { data, error } = await db
      .from("website_projects")
      .select("*, website_project_images(*)")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const project = normalizeProject(data);
    if (!project.cover_image_url || project.website_project_images.length === 0) return null;
    return project;
  } catch (error) {
    console.error(`Unable to load website project ${slug}:`, error);
    return null;
  }
}
