import { NextResponse } from "next/server";
import { requireAdmin, requireProjectAccess } from "@/lib/portal-auth";
import { getPortalDb } from "@/lib/portal-db";
import { DOCUMENT_BUCKET } from "@/lib/portal-documents";
import { checkDocumentMutation, documentBody, documentError, DocumentError, documentMetadata, documentResponse, DOCUMENT_FIELDS } from "@/lib/portal-document-server";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string; documentId: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { id, documentId } = await context.params;
    await requireProjectAccess(id);
    const db = getPortalDb();
    const { data: doc, error } = await db.from("portal_documents").select("storage_path,original_filename").eq("project_id", id).eq("id", documentId).maybeSingle();
    if (error) throw error;
    if (!doc) throw new DocumentError("Document not found.", 404);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const link = await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(doc.storage_path, 900, download ? { download: doc.original_filename } : undefined);
    if (link.error) throw link.error;
    if (new URL(request.url).searchParams.get("redirect") === "1") {
      const response = NextResponse.redirect(link.data.signedUrl, 302);
      response.headers.set("Cache-Control", "private, no-store");
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }
    return documentResponse({ url: link.data.signedUrl });
  } catch (error) { return documentError(error); }
}

export async function PATCH(request: Request, context: Context) {
  try {
    await requireAdmin();
    checkDocumentMutation(request);
    const { id, documentId } = await context.params;
    const metadata = documentMetadata(await documentBody(request));
    const { data, error } = await getPortalDb().from("portal_documents").update(metadata).eq("project_id", id).eq("id", documentId).select(DOCUMENT_FIELDS).maybeSingle();
    if (error) throw error;
    if (!data) throw new DocumentError("Document not found.", 404);
    return documentResponse({ document: data });
  } catch (error) { return documentError(error); }
}

export async function DELETE(request: Request, context: Context) {
  try {
    await requireAdmin();
    checkDocumentMutation(request);
    const { id, documentId } = await context.params;
    const db = getPortalDb();
    const doc = await db.from("portal_documents").select("storage_path").eq("project_id", id).eq("id", documentId).maybeSingle();
    if (doc.error) throw doc.error;
    if (!doc.data) return documentResponse({ ok: true });
    // Remove the object before its metadata; failures retain a retryable record.
    const removed = await db.storage.from(DOCUMENT_BUCKET).remove([doc.data.storage_path]);
    if (removed.error) throw removed.error;
    const deleted = await db.from("portal_documents").delete().eq("project_id", id).eq("id", documentId);
    if (deleted.error) throw deleted.error;
    return documentResponse({ ok: true });
  } catch (error) { return documentError(error); }
}
