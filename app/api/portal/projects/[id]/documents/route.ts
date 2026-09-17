import crypto from "node:crypto";
import { PDFDocument } from "pdf-lib";
import { requireAdmin, requireProjectAccess } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";
import { DOCUMENT_BUCKET, DOCUMENT_LIMIT } from "@/lib/portal-documents";
import { checkDocumentMutation, documentBody, documentError, DocumentError, documentResponse, DOCUMENT_FIELDS, documentUploadMetadata, readUploadTicket, signUploadTicket } from "@/lib/portal-document-server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Context) {
  try {
    const { id } = await context.params;
    await requireProjectAccess(id);
    const { data, error } = await getPortalDb().from("portal_documents").select(DOCUMENT_FIELDS).eq("project_id", id).order("created_at", { ascending: false });
    if (error) throw error;
    return documentResponse({ documents: data || [] });
  } catch (error) { return documentError(error); }
}

export async function POST(request: Request, context: Context) {
  try {
    await requireAdmin();
    checkDocumentMutation(request);
    const { id } = await context.params;
    const body = await documentBody(request);
    const db = getPortalDb();

    if (body.action === "prepare") {
      const metadata = documentUploadMetadata(body);
      const project = await db.from("portal_projects").select("id").eq("id", id).maybeSingle();
      if (project.error) throw project.error;
      if (!project.data) throw new DocumentError("Project not found.", 404);
      const bucket = await db.storage.getBucket(DOCUMENT_BUCKET);
      if (bucket.error) throw bucket.error;
      if (bucket.data.public) throw new DocumentError("Set portal-documents to private before uploading.", 409);
      const documentId = crypto.randomUUID();
      const storage_path = `${id}/${documentId}.pdf`;
      const { data, error } = await db.storage.from(DOCUMENT_BUCKET).createSignedUploadUrl(storage_path, { upsert: false });
      if (error) throw error;
      const ticket = signUploadTicket({ ...metadata, id: documentId, project_id: id, storage_path, exp: Date.now() + 2 * 60 * 60 * 1000 });
      return documentResponse({ uploadUrl: data.signedUrl, ticket });
    }

    if (body.action !== "complete" && body.action !== "cancel") throw new DocumentError("Invalid upload action.");
    const ticket = readUploadTicket(body.ticket, id);
    const existing = await db.from("portal_documents").select(DOCUMENT_FIELDS).eq("id", ticket.id).eq("project_id", id).maybeSingle();
    if (existing.error) throw existing.error;
    // Safe to retry completion if the first response was lost.
    if (existing.data) return documentResponse({ document: existing.data });
    if (body.action === "cancel") {
      const { error } = await db.storage.from(DOCUMENT_BUCKET).remove([ticket.storage_path]);
      if (error) throw error;
      return documentResponse({ ok: true });
    }

    // Independently validate the stored bytes; never trust browser size/type alone.
    const stored = await db.storage.from(DOCUMENT_BUCKET).download(ticket.storage_path);
    if (stored.error) throw new DocumentError("Upload not found. Retry the upload.", 409);
    const bytes = new Uint8Array(await stored.data.arrayBuffer());
    try {
      if (bytes.length !== ticket.file_size || bytes.length >= DOCUMENT_LIMIT || !new TextDecoder().decode(bytes.slice(0, 8)).startsWith("%PDF-")) throw new Error();
      const pdf = await PDFDocument.load(bytes, { updateMetadata: false });
      if (pdf.getPageCount() < 1) throw new Error();
    } catch {
      await db.storage.from(DOCUMENT_BUCKET).remove([ticket.storage_path]);
      throw new DocumentError("Upload a valid, unencrypted PDF below 5 MB.");
    }
    const { exp: _expiry, ...record } = ticket;
    const { data, error } = await db.from("portal_documents").insert(record).select(DOCUMENT_FIELDS).single();
    if (error) {
      // A simultaneous retry may have completed successfully.
      const retry = await db.from("portal_documents").select(DOCUMENT_FIELDS).eq("id", ticket.id).eq("project_id", id).maybeSingle();
      if (retry.data) return documentResponse({ document: retry.data });
      // Keep bytes available for retry; cancelling the upload removes them.
      throw error;
    }
    return documentResponse({ document: data }, 201);
  } catch (error) { return documentError(error); }
}
