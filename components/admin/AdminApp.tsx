"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, ImagePlus, LogOut, Plus, Save, Star, Trash2, X } from "lucide-react";
import styles from "./admin.module.css";

type ProjectImage = {
  id: string;
  project_id: string;
  storage_path: string;
  image_url: string;
  image_type: string;
  caption: string | null;
  is_cover: boolean;
  display_order: number;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  category: string;
  status: string;
  year: string | null;
  area: string | null;
  short_description: string | null;
  description: string | null;
  services: string[];
  featured: boolean;
  display_order: number;
  cover_image_url: string | null;
  website_project_images: ProjectImage[];
};

const blank = {
  title: "",
  slug: "",
  location: "Kasaragod, Kerala",
  category: "Residential",
  status: "Ongoing",
  year: "",
  area: "",
  short_description: "",
  description: "",
  services: "Architecture, Engineering, Construction",
  featured: false,
  display_order: 0,
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function AdminApp() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageType, setImageType] = useState("Exterior");
  const [caption, setCaption] = useState("");

  const selected = useMemo(() => projects.find((project) => project.id === selectedId) || null, [projects, selectedId]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load projects.");
      setProjects(body.projects || []);
      if (!selectedId && body.projects?.length) setSelectedId(body.projects[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selected) return;
    setForm({
      title: selected.title || "",
      slug: selected.slug || "",
      location: selected.location || "",
      category: selected.category || "Residential",
      status: selected.status || "Ongoing",
      year: selected.year || "",
      area: selected.area || "",
      short_description: selected.short_description || "",
      description: selected.description || "",
      services: (selected.services || []).join(", "),
      featured: Boolean(selected.featured),
      display_order: selected.display_order || 0,
    });
  }, [selected]);

  function newProject() {
    setSelectedId(null);
    setForm({ ...blank });
    setNotice("");
    setError("");
  }

  function update(name: keyof typeof blank, value: string | number | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveProject(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      services: form.services.split(",").map((item) => item.trim()).filter(Boolean),
      display_order: Number(form.display_order) || 0,
    };

    try {
      const response = await fetch(selectedId ? `/api/admin/projects/${selectedId}` : "/api/admin/projects", {
        method: selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to save project.");
      setNotice(selectedId ? "Project updated." : "Project created.");
      const nextId = body.project?.id || selectedId;
      await load();
      if (nextId) setSelectedId(nextId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!selected) return;
    const confirmed = window.confirm(`Delete “${selected.title}” and all its uploaded images? This cannot be undone.`);
    if (!confirmed) return;
    setError("");
    const response = await fetch(`/api/admin/projects/${selected.id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) return setError(body.error || "Unable to delete project.");
    setSelectedId(null);
    setForm({ ...blank });
    setNotice("Project deleted.");
    await load();
  }

  async function uploadImages(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const formElement = event.currentTarget;
    const input = formElement.elements.namedItem("images") as HTMLInputElement;
    if (!input.files?.length) return setError("Choose at least one image.");
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(input.files)) {
        const data = new FormData();
        data.append("file", file);
        data.append("image_type", imageType);
        data.append("caption", caption);
        const response = await fetch(`/api/admin/projects/${selected.id}/images`, { method: "POST", body: data });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || `Unable to upload ${file.name}.`);
      }
      formElement.reset();
      setCaption("");
      setNotice("Image upload complete.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload images.");
    } finally {
      setUploading(false);
    }
  }

  async function setCover(image: ProjectImage) {
    const response = await fetch(`/api/admin/images/${image.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_cover: true }),
    });
    const body = await response.json();
    if (!response.ok) return setError(body.error || "Unable to set cover image.");
    setNotice("Cover image updated.");
    await load();
  }

  async function deleteImage(image: ProjectImage) {
    if (!window.confirm("Delete this image?")) return;
    const response = await fetch(`/api/admin/images/${image.id}`, { method: "DELETE" });
    const body = await response.json();
    if (!response.ok) return setError(body.error || "Unable to delete image.");
    setNotice("Image deleted.");
    await load();
  }

  async function logout() {
    await fetch("/api/portal/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className={styles.adminPage}>
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="/"><img src="/logo/modex-logo.svg" alt="Modex" /><span>Website Admin</span></a>
        <div className={styles.sidebarHeading}>PROJECTS</div>
        <button className={styles.newButton} type="button" onClick={newProject}><Plus size={17}/> New Project</button>
        <nav className={styles.projectNav}>
          {loading && <span className={styles.muted}>Loading…</span>}
          {!loading && !projects.length && <span className={styles.muted}>No projects yet.</span>}
          {projects.map((project) => {
            const isPublic = Boolean(project.cover_image_url || project.website_project_images?.length);
            return (
              <button key={project.id} type="button" data-active={selectedId === project.id} onClick={() => setSelectedId(project.id)}>
                <span>{project.title}</span>
                <small>{project.category} · {isPublic ? "Public" : "Hidden until image"}{project.featured ? " · Featured" : ""}</small>
              </button>
            );
          })}
        </nav>
        <div className={styles.sidebarBottom}>
          <a href="/projects" target="_blank" rel="noreferrer"><ExternalLink size={15}/> View Public Projects</a>
          <button type="button" onClick={logout}><LogOut size={15}/> Log out</button>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.workspaceHeader}>
          <div><span>{selected ? "EDIT PROJECT" : "NEW PROJECT"}</span><h1>{selected?.title || "Add a project"}</h1></div>
          {selected && Boolean(selected.cover_image_url || selected.website_project_images?.length) ? (
            <a href={`/projects/${selected.slug}`} target="_blank" rel="noreferrer">Preview project <ExternalLink size={15}/></a>
          ) : selected ? (
            <span className={styles.hiddenStatus}>Hidden until an image is uploaded</span>
          ) : null}
        </header>

        {(notice || error) && <div className={error ? styles.alertError : styles.alert}>{error || notice}<button onClick={() => { setNotice(""); setError(""); }}><X size={14}/></button></div>}

        <div className={styles.editorGrid}>
          <form className={styles.editorCard} onSubmit={saveProject}>
            <div className={styles.cardTitle}><div><span>PROJECT DETAILS</span><h2>Public project information</h2></div><button className={styles.saveButton} type="submit" disabled={saving}><Save size={16}/>{saving ? "Saving…" : "Save"}</button></div>
            <div className={styles.formGrid}>
              <label className={styles.full}>Project Name<input required value={form.title} onChange={(e) => { update("title", e.target.value); if (!selectedId && !form.slug) update("slug", slugify(e.target.value)); }} placeholder="Gafoor Residence" /></label>
              <label>URL Slug<input required value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} placeholder="gafoor-residence" /></label>
              <label>Location<input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="Kasaragod, Kerala" /></label>
              <label>Category<select value={form.category} onChange={(e) => update("category", e.target.value)}><option>Residential</option><option>Commercial</option><option>Interior</option><option>Renovation</option><option>Institutional</option><option>Mixed Use</option></select></label>
              <label>Status<select value={form.status} onChange={(e) => update("status", e.target.value)}><option>Proposed</option><option>Ongoing</option><option>Completed</option></select></label>
              <label>Year<input value={form.year} onChange={(e) => update("year", e.target.value)} placeholder="2026" /></label>
              <label>Built-up Area<input value={form.area} onChange={(e) => update("area", e.target.value)} placeholder="3,200 sq.ft" /></label>
              <label className={styles.full}>Services <small>Separate with commas</small><input value={form.services} onChange={(e) => update("services", e.target.value)} placeholder="Architecture, Engineering, Construction" /></label>
              <label className={styles.full}>Short Description<textarea rows={3} value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Short text used in portfolio cards and project introduction." /></label>
              <label className={styles.full}>Full Project Story<textarea rows={6} value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Design approach, client brief, site response and execution story." /></label>
              <label>Display Order<input type="number" min="0" value={form.display_order} onChange={(e) => update("display_order", Number(e.target.value))} /></label>
              <label className={styles.checkLabel}><input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} /><span><Star size={16}/> Featured on homepage</span></label>
            </div>
            {selected && <div className={styles.dangerZone}><div><strong>Delete project</strong><span>Removes the project and all portfolio images.</span></div><button type="button" onClick={deleteProject}><Trash2 size={15}/> Delete</button></div>}
          </form>

          <section className={styles.mediaCard}>
            <div className={styles.cardTitle}><div><span>PROJECT MEDIA</span><h2>Images & gallery</h2></div><ImagePlus size={20}/></div>
            {!selected ? <div className={styles.emptyMedia}>Save the project first, then upload its images.</div> : <>
              <form className={styles.uploadForm} onSubmit={uploadImages}>
                <label>Image Type<select value={imageType} onChange={(e) => setImageType(e.target.value)}><option>Exterior</option><option>Interior</option><option>3D Render</option><option>Floor Plan</option><option>Construction</option><option>Before</option><option>After</option></select></label>
                <label>Caption<input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Optional caption" /></label>
                <label className={styles.fileInput}>Choose Images<input name="images" type="file" accept="image/*" multiple /></label>
                <button type="submit" disabled={uploading}><ImagePlus size={16}/>{uploading ? "Uploading…" : "Upload"}</button>
              </form>

              <div className={styles.imageGrid}>
                {!selected.website_project_images?.length && <div className={styles.emptyMedia}>No images uploaded yet.</div>}
                {(selected.website_project_images || []).map((image) => (
                  <article key={image.id} className={styles.imageCard}>
                    <img src={image.image_url} alt={image.caption || selected.title} />
                    <div className={styles.imageMeta}><div><strong>{image.image_type}</strong><span>{image.caption || "No caption"}</span></div>{image.is_cover && <b>Cover</b>}</div>
                    <div className={styles.imageActions}>
                      {!image.is_cover && <button type="button" onClick={() => setCover(image)}><Star size={14}/> Set Cover</button>}
                      <button type="button" onClick={() => deleteImage(image)}><Trash2 size={14}/> Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </>}
          </section>
        </div>
      </section>
    </main>
  );
}
