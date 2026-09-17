"use client";

import { type FormEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Download, ExternalLink, FileText, FolderOpen, Loader2, Pencil, Plus, Search, Trash2, UploadCloud, X } from "lucide-react";
import { DOCUMENT_CATEGORIES, DOCUMENT_LIMIT, SOURCE_LIMIT, documentSize, type DocumentCategory, type PortalDocument } from "@/lib/portal-documents";
import type { PortalRole } from "@/lib/portal-types";
import styles from "./documents.module.css";

class RequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: "no-store", headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new RequestError(data.error || "Unable to complete the request. Please retry.", response.status);
  return data as T;
}

export default function DocumentsView({ projectId, role }: { projectId: string; role: PortalRole }) {
  const base = `/api/portal/projects/${encodeURIComponent(projectId)}/documents`;
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [editor, setEditor] = useState<"new" | PortalDocument | null>(null);
  const [viewer, setViewer] = useState<PortalDocument | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function refresh() {
    setError(""); setLoading(true);
    try { setDocuments((await request<{ documents: PortalDocument[] }>(base)).documents); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to load documents."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    request<{ documents: PortalDocument[] }>(base, { signal: controller.signal })
      .then(data => setDocuments(data.documents))
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [base]);

  async function remove(doc: PortalDocument) {
    if (!window.confirm(`Delete “${doc.title}” (${doc.revision})? This removes the document for this project.`)) return;
    setDeleting(doc.id); setError("");
    try {
      await request(`${base}/${doc.id}`, { method: "DELETE" });
      setDocuments(current => current.filter(item => item.id !== doc.id));
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete document."); }
    finally { setDeleting(null); }
  }
  const visible = documents.filter(doc => (category === "All" || doc.category === category) && `${doc.title} ${doc.original_filename} ${doc.revision} ${doc.notes || ""}`.toLowerCase().includes(query.toLowerCase()));

  return <section className={styles.section} aria-label="Project documents">
    <div className={styles.heading}>
      <div><span className={styles.eyebrow}>PROJECT FILES</span><h2>Documents</h2><p>Plans, designs and paperwork, together in one place.</p></div>
      {role === "admin" && <button className={styles.primary} onClick={() => setEditor("new")}><Plus size={17}/> Upload files</button>}
    </div>
    <div className={styles.toolbar}>
      <label className={styles.search}><Search size={17}/><input aria-label="Search documents" placeholder="Search documents…" value={query} onChange={e => setQuery(e.target.value)}/></label>
      <select aria-label="Document category" value={category} onChange={e => setCategory(e.target.value)}><option value="All">All categories</option>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select>
      <span className={styles.count}>{visible.length} {visible.length === 1 ? "document" : "documents"}</span>
    </div>
    {error && <div className={styles.error} role="alert">{error} <button onClick={refresh}>Retry</button></div>}
    {loading ? <div className={styles.empty} role="status"><Loader2 className={styles.spin}/><p>Loading documents…</p></div> : visible.length === 0 ? <div className={styles.empty}><FolderOpen size={38}/><h3>{documents.length ? "No matching documents" : "Your project files will appear here"}</h3><p>{documents.length ? "Try a different search or category." : role === "admin" ? "Upload the first plan, design or document for your client." : "Modex will add plans and documents as your project progresses."}</p></div> : <div className={styles.grid}>
      {visible.map(doc => <article className={styles.card} key={doc.id}>
        <div className={styles.cardTop}><span className={styles.icon}><FileText size={25}/></span><span className={styles.badge}>{doc.category}</span></div>
        <h3>{doc.title}</h3><p className={styles.filename} title={doc.original_filename}>{doc.original_filename}</p>
        <div className={styles.metadata}><span>{doc.revision}</span><span>{documentSize(doc.file_size)}</span><span>{new Date(doc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></div>
        {doc.notes && <p className={styles.notes}>{doc.notes}</p>}
        <div className={styles.cardActions}>
          <button className={styles.secondary} onClick={() => setViewer(doc)}><FileText size={15}/> View</button>
          <a className={styles.iconButton} href={`${base}/${doc.id}?download=1&redirect=1`} target="_blank" rel="noopener noreferrer" aria-label={`Download ${doc.title}`} title="Download"><Download size={17}/></a>
          {role === "admin" && <><button className={styles.iconButton} onClick={() => setEditor(doc)} aria-label={`Edit ${doc.title}`} title="Edit details"><Pencil size={16}/></button><button className={`${styles.iconButton} ${styles.danger}`} disabled={deleting === doc.id} onClick={() => remove(doc)} aria-label={`Delete ${doc.title}`} title="Delete">{deleting === doc.id ? <Loader2 size={16} className={styles.spin}/> : <Trash2 size={16}/>}</button></>}
        </div>
      </article>)}
    </div>}
    {editor && <DocumentEditor base={base} document={editor === "new" ? undefined : editor} onClose={() => setEditor(null)} onSaved={doc => { setDocuments(current => [doc, ...current.filter(item => item.id !== doc.id)]); setEditor(null); }}/ >}
    {viewer && <PdfViewer base={base} document={viewer} onClose={() => setViewer(null)}/>}
  </section>;
}

function Dialog({ title, children, onClose, busy = false, wide = false }: { title: string; children: ReactNode; onClose: () => void; busy?: boolean; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) closeRef.current();
      if (event.key !== "Tab") return;
      const focusable = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe') || []);
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = oldOverflow; previous?.focus(); };
  }, [busy]);
  return <div className={styles.backdrop} data-lenis-prevent><div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`${styles.dialog} ${wide ? styles.wide : ""}`}><header className={styles.dialogHeader}><h2>{title}</h2><button className={styles.iconButton} disabled={busy} onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header>{children}</div></div>;
}

function PdfViewer({ base, document: doc, onClose }: { base: string; document: PortalDocument; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setUrl(""); setError("");
    request<{ url: string }>(`${base}/${doc.id}`, { signal: controller.signal }).then(data => setUrl(data.url)).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [base, doc.id, generation]);
  return <Dialog title={doc.title} onClose={onClose} wide>
    <div className={styles.viewerBar}><span>{doc.category} · {doc.revision} · {documentSize(doc.file_size)}</span><a href={`${base}/${doc.id}?redirect=1`} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/> Open in new tab</a><a href={`${base}/${doc.id}?download=1&redirect=1`} target="_blank" rel="noopener noreferrer"><Download size={15}/> Download</a><button onClick={() => setGeneration(value => value + 1)}>Refresh viewer</button></div>
    {error ? <p className={styles.error} role="alert">{error}</p> : url ? <PdfPages url={url} title={doc.title}/> : <div className={styles.empty} role="status"><Loader2 className={styles.spin}/><p>Opening PDF…</p></div>}
    <p className={styles.hint}>Scroll or swipe vertically to review every page. You can also use Open in new tab or Download.</p>
  </Dialog>;
}

function PdfPages({ url, title }: { url: string; title: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pageCount, setPageCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: { destroy: () => Promise<void> } | null = null;
    const container = host.current;
    if (!container) return;

    async function renderPdf() {
      setLoading(true); setError(""); setPageCount(0);
      container.replaceChildren();
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const task = pdfjs.getDocument({ url, withCredentials: false });
        loadingTask = task as unknown as { destroy: () => Promise<void> };
        const pdf = await task.promise;
        if (cancelled) return;
        setPageCount(pdf.numPages);

        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
          if (cancelled) return;
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssWidth = Math.max(240, Math.min(container.clientWidth - 16, 1100));
          const cssScale = cssWidth / baseViewport.width;
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = page.getViewport({ scale: cssScale * pixelRatio });

          const wrapper = document.createElement("div");
          wrapper.className = styles.pdfPage;
          wrapper.setAttribute("aria-label", `Page ${pageNumber} of ${pdf.numPages}`);

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) throw new Error("PDF preview is not supported in this browser.");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          canvas.style.width = `${Math.round(viewport.width / pixelRatio)}px`;
          canvas.style.height = `${Math.round(viewport.height / pixelRatio)}px`;
          canvas.setAttribute("role", "img");
          canvas.setAttribute("aria-label", `${title}, page ${pageNumber}`);

          const label = document.createElement("span");
          label.className = styles.pdfPageNumber;
          label.textContent = `${pageNumber} / ${pdf.numPages}`;
          wrapper.append(canvas, label);
          container.appendChild(wrapper);

          await page.render({ canvasContext: context, viewport }).promise;
          page.cleanup();
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unable to preview this PDF.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
      container.replaceChildren();
      void loadingTask?.destroy();
    };
  }, [url, title]);

  return <div className={styles.pdfShell}>
    {loading && <div className={styles.pdfLoading} role="status"><Loader2 className={styles.spin}/><span>Preparing {pageCount ? `${pageCount} pages` : "preview"}…</span></div>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div ref={host} className={styles.pdfPages} data-lenis-prevent aria-label={`${title} PDF pages`}/>
  </div>;
}

type PreparedPdf = { file: File; originalSize: number; imagesChanged: boolean; pages: number; sourceCount: number; sourceLabel: string };
function DocumentEditor({ base, document: doc, onClose, onSaved }: { base: string; document?: PortalDocument; onClose: () => void; onSaved: (doc: PortalDocument) => void }) {
  const [title, setTitle] = useState(doc?.title || "");
  const [category, setCategory] = useState<DocumentCategory>(doc?.category || "Plans");
  const [revision, setRevision] = useState(doc?.revision || "R1");
  const [notes, setNotes] = useState(doc?.notes || "");
  const [prepared, setPrepared] = useState<PreparedPdf | null>(null);
  const [preview, setPreview] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const worker = useRef<Worker | null>(null);
  const workerTimeout = useRef<number | null>(null);
  const sequence = useRef(0);
  const pending = useRef<{ ticket: string; transferred: boolean } | null>(null);
  const [needsPublish, setNeedsPublish] = useState(false);
  useEffect(() => () => { sequence.current++; worker.current?.terminate(); if (workerTimeout.current) clearTimeout(workerTimeout.current); }, []);
  useEffect(() => {
    if (!prepared) { setPreview(""); return; }
    const url = URL.createObjectURL(prepared.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [prepared]);

  async function imageToJpeg(file: File, maxSide: number, quality: number) {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const item = new Image();
        item.onload = () => resolve(item);
        item.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
        item.src = objectUrl;
      });
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("Image compression is not supported in this browser.");
      context.fillStyle = "#fff"; context.fillRect(0, 0, width, height); context.drawImage(image, 0, 0, width, height);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) throw new Error(`Unable to compress ${file.name}.`);
      return { bytes: new Uint8Array(await blob.arrayBuffer()), width, height };
    } finally { URL.revokeObjectURL(objectUrl); }
  }

  async function makeImagePdf(files: File[]) {
    const attempts = [
      { maxSide: 1800, quality: .78 }, { maxSide: 1600, quality: .68 }, { maxSide: 1400, quality: .58 },
      { maxSide: 1200, quality: .50 }, { maxSide: 1000, quality: .44 },
    ];
    for (const attempt of attempts) {
      const pdf = await PDFDocument.create();
      for (let index = 0; index < files.length; index++) {
        setStatus(`Compressing image ${index + 1} of ${files.length}…`);
        const converted = await imageToJpeg(files[index], attempt.maxSide, attempt.quality);
        const embedded = await pdf.embedJpg(converted.bytes);
        const pageScale = Math.min(1, 842 / Math.max(converted.width, converted.height));
        const pageWidth = Math.max(72, converted.width * pageScale);
        const pageHeight = Math.max(72, converted.height * pageScale);
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawImage(embedded, { x: 0, y: 0, width: pageWidth, height: pageHeight });
      }
      setStatus("Building document…");
      const bytes = await pdf.save({ useObjectStreams: true, addDefaultPage: false });
      if (bytes.length < DOCUMENT_LIMIT) return bytes;
    }
    throw new Error("These images still exceed 5 MB after compression. Select fewer images and try again.");
  }

  async function prepareFiles(list?: FileList | null) {
    const current = ++sequence.current;
    if (workerTimeout.current) clearTimeout(workerTimeout.current);
    worker.current?.terminate(); worker.current = null;
    setPrepared(null); setError(""); setReviewed(false); setProcessing(false); setStatus("");
    if (!list?.length) return;
    const files = Array.from(list).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));
    const pdfs = files.filter(file => file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf");
    const images = files.filter(file => /\.(jpe?g|png)$/i.test(file.name) || ["image/jpeg", "image/png"].includes(file.type));
    if (pdfs.length && images.length) { setError("Choose either one PDF or a group of JPG/PNG images, not both together."); return; }
    if (pdfs.length > 1 || (pdfs.length === 1 && files.length !== 1)) { setError("Only one PDF can be uploaded at a time."); return; }
    if (images.length !== files.length) { setError("Supported files are PDF, JPG, JPEG and PNG."); return; }
    if (images.length > 30) { setError("Select up to 30 images at a time."); return; }
    const originalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!originalSize || originalSize > SOURCE_LIMIT) { setError("The selected source files must total 50 MB or less."); return; }
    setProcessing(true);
    try {
      if (pdfs.length === 1) {
        const file = pdfs[0];
        if (file.size > SOURCE_LIMIT) throw new Error("Choose a PDF between 1 byte and 50 MB.");
        if (!title) setTitle(file.name.replace(/\.pdf$/i, "").slice(0, 200));
        setStatus("Preparing PDF…");
        const bytes = await file.arrayBuffer();
        if (current !== sequence.current) return;
        const instance = new Worker(new URL("../../lib/pdf-compress.worker.ts", import.meta.url), { type: "module" });
        worker.current = instance;
        const timeout = window.setTimeout(() => { instance.terminate(); if (current === sequence.current) { setProcessing(false); setError("Compression took too long. Try a smaller PDF or split it into separate documents."); } }, 120_000);
        workerTimeout.current = timeout;
        instance.onmessage = event => {
          if (current !== sequence.current) { clearTimeout(timeout); return; }
          if (event.data.type === "progress") { setStatus(event.data.message); return; }
          clearTimeout(timeout); instance.terminate(); setProcessing(false); setStatus("");
          if (event.data.type === "error") { setError(event.data.message); return; }
          const result = new File([event.data.bytes], file.name, { type: "application/pdf" });
          if (result.size >= DOCUMENT_LIMIT) { setError("PDF must be below 5 MB."); return; }
          setPrepared({ file: result, originalSize: file.size, imagesChanged: event.data.imagesChanged, pages: event.data.pages, sourceCount: 1, sourceLabel: "PDF" });
        };
        instance.onerror = () => { clearTimeout(timeout); instance.terminate(); if (current === sequence.current) { setProcessing(false); setError("Unable to prepare PDF. Refresh the page and try again."); } };
        instance.postMessage({ bytes }, [bytes]);
        return;
      }

      if (!title) {
        const firstName = images[0].name.replace(/\.(jpe?g|png)$/i, "");
        setTitle((images.length > 1 ? `${firstName} - Photo Set` : firstName).slice(0, 200));
      }
      const bytes = await makeImagePdf(images);
      if (current !== sequence.current) return;
      const baseName = images[0].name.replace(/\.(jpe?g|png)$/i, "").replace(/[^a-z0-9-_ ]/gi, "").trim() || "images";
      const result = new File([bytes], `${baseName}${images.length > 1 ? "-photo-set" : ""}.pdf`, { type: "application/pdf" });
      setPrepared({ file: result, originalSize, imagesChanged: true, pages: images.length, sourceCount: images.length, sourceLabel: images.length === 1 ? "image" : "images" });
      setStatus(""); setProcessing(false);
    } catch (e) {
      if (current === sequence.current) { setProcessing(false); setStatus(""); setError(e instanceof Error ? e.message : "Unable to prepare these files."); }
    }
  }

  async function close() {
    if (busy) return;
    if (pending.current) {
      setBusy(true);
      try {
        const result = await request<{ document?: PortalDocument }>(base, { method: "POST", body: JSON.stringify({ action: "cancel", ticket: pending.current.ticket }) });
        pending.current = null;
        if (result.document) { onSaved(result.document); return; }
      } catch { setError("Unable to cancel the pending upload. Retry publishing or closing the form."); setBusy(false); return; }
      setBusy(false);
    }
    onClose();
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const metadata = { title, category, revision, notes };
      if (doc) {
        const result = await request<{ document: PortalDocument }>(`${base}/${doc.id}`, { method: "PATCH", body: JSON.stringify(metadata) });
        onSaved(result.document); return;
      }
      if (!prepared || (prepared.imagesChanged && !reviewed)) throw new Error("Prepare and review the PDF before uploading.");
      if (!pending.current) {
        setStatus("Starting upload…");
        const result = await request<{ uploadUrl: string; ticket: string }>(base, { method: "POST", body: JSON.stringify({ action: "prepare", ...metadata, file_size: prepared.file.size, original_file_size: prepared.originalSize, original_filename: prepared.file.name }) });
        pending.current = { ticket: result.ticket, transferred: false };
        setStatus("Uploading PDF…");
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 120_000);
        try {
          const upload = await fetch(result.uploadUrl, { method: "PUT", credentials: "omit", headers: { "Content-Type": "application/pdf", "Cache-Control": "max-age=0", "x-upsert": "false" }, body: prepared.file, signal: controller.signal });
          if (!upload.ok) throw new Error("PDF upload failed. Check the private bucket permits PDFs up to 5 MB, then retry.");
          pending.current.transferred = true;
        } finally { clearTimeout(timeout); }
      }
      setStatus("Checking and publishing PDF…");
      const result = await request<{ document: PortalDocument }>(base, { method: "POST", body: JSON.stringify({ action: "complete", ticket: pending.current.ticket }) });
      pending.current = null; onSaved(result.document);
    } catch (e) {
      if (pending.current && (!pending.current.transferred || (e instanceof RequestError && e.status === 400))) {
        try { await request(base, { method: "POST", body: JSON.stringify({ action: "cancel", ticket: pending.current.ticket }) }); pending.current = null; }
        catch { /* Retain ticket for explicit cancellation instead of losing it. */ }
      }
      setNeedsPublish(Boolean(pending.current));
      setError(e instanceof Error ? e.message : "Upload failed. Please retry.");
    } finally { setBusy(false); setStatus(""); }
  }

  return <Dialog title={doc ? "Edit document details" : "Upload project files"} onClose={close} busy={busy}>
    <form onSubmit={submit} className={styles.form}>
      {!doc && <label className={styles.upload}><UploadCloud size={28}/><strong>Choose a PDF or images</strong><span>PDF: one file · Images: select up to 30 JPG/JPEG/PNG files together</span><span>Images are compressed and combined into one PDF · stored below 5 MB</span><input aria-label="Choose PDF or image files" type="file" accept="application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png" multiple disabled={busy || needsPublish} onChange={e => prepareFiles(e.target.files)}/></label>}
      {(processing || busy) && <p className={styles.progress} role="status"><Loader2 size={17} className={styles.spin}/>{status || "Saving…"}</p>}
      {prepared && <div className={styles.prepared}><strong>{prepared.file.name}</strong><span>{prepared.sourceCount} {prepared.sourceLabel} · {documentSize(prepared.originalSize)} → {documentSize(prepared.file.size)} · {prepared.pages} {prepared.pages === 1 ? "page" : "pages"}</span>{preview && <a href={preview} target="_blank" rel="noopener noreferrer"><ExternalLink size={14}/> Preview prepared PDF</a>}{prepared.imagesChanged && <><p>Images were compressed. Check that photos, drawings and scanned text remain clear before uploading.</p><label className={styles.check}><input type="checkbox" checked={reviewed} onChange={e => setReviewed(e.target.checked)} disabled={busy || needsPublish}/> I have checked the prepared PDF.</label></>}</div>}
      <fieldset disabled={busy || needsPublish}>
        <label className={styles.field}>Document title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Ground Floor Plan" maxLength={200} required/></label>
        <div className={styles.formRow}><label className={styles.field}>Category<select value={category} onChange={e => setCategory(e.target.value as DocumentCategory)}>{DOCUMENT_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></label><label className={styles.field}>Revision<input value={revision} onChange={e => setRevision(e.target.value)} placeholder="R1" maxLength={30} required/></label></div>
        <label className={styles.field}>Note <span className={styles.optional}>(optional)</span><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="A short note for your client" maxLength={2000} rows={3}/></label>
      </fieldset>
      {!doc && <p className={styles.hint}>Upload a revised drawing as a new document with its revision number to keep the previous version available.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={close} disabled={busy}>Cancel</button><button className={styles.primary} disabled={busy || processing || (!doc && (!prepared || (prepared.imagesChanged && !reviewed)))}>{busy ? "Saving…" : doc ? "Save details" : needsPublish ? "Retry publishing" : "Upload document"}</button></div>
    </form>
  </Dialog>;
}
