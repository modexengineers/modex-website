import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { DOCUMENT_CATEGORIES, DOCUMENT_LIMIT, SOURCE_LIMIT, type DocumentCategory } from "./portal-documents";

export const DOCUMENT_FIELDS = "id,project_id,title,category,revision,notes,original_filename,mime_type,file_size,original_file_size,created_at";
export class DocumentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function documentResponse(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function documentError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "UNAUTHORIZED") return documentResponse({ error: "Please sign in as an authorised user." }, 401);
  if (message === "FORBIDDEN") return documentResponse({ error: "You cannot access this project's documents." }, 403);
  if (error instanceof DocumentError) return documentResponse({ error: error.message }, error.status);
  // Do not log signed links, upload tickets or credentials.
  console.error("Document operation failed", error instanceof Error ? error.name : "Database/storage error");
  return documentResponse({ error: "Unable to complete the document request. Check the private bucket and table setup, then retry." }, 500);
}

export function checkDocumentMutation(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new DocumentError("Request origin not allowed.", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new DocumentError("Expected a JSON request.");
}

export async function documentBody(request: Request): Promise<Record<string, unknown>> {
  const text = await request.text();
  if (text.length > 20_000) throw new DocumentError("Document details are too long.");
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new DocumentError("Invalid document details."); }
}

function field(value: unknown, label: string, max: number, optional = false) {
  const text = typeof value === "string" ? value.trim() : "";
  if ((!text && !optional) || text.length > max) throw new DocumentError(`Enter a valid ${label} (maximum ${max} characters).`);
  return text;
}

export function documentMetadata(body: Record<string, unknown>) {
  const category = field(body.category, "category", 30) as DocumentCategory;
  if (!DOCUMENT_CATEGORIES.includes(category)) throw new DocumentError("Choose a document category.");
  return {
    title: field(body.title, "title", 200), category,
    revision: field(body.revision, "revision", 30),
    notes: field(body.notes, "note", 2000, true) || null,
  };
}

export function documentUploadMetadata(body: Record<string, unknown>) {
  const file_size = Number(body.file_size);
  const original_file_size = Number(body.original_file_size);
  if (!Number.isSafeInteger(file_size) || file_size <= 0 || file_size >= DOCUMENT_LIMIT) throw new DocumentError("The PDF must be below 5 MB.");
  if (!Number.isSafeInteger(original_file_size) || original_file_size < file_size || original_file_size > SOURCE_LIMIT) throw new DocumentError("Invalid original file size.");
  const original_filename = field(body.original_filename, "PDF filename", 255);
  if (!original_filename.toLowerCase().endsWith(".pdf")) throw new DocumentError("Please choose a PDF file.");
  return { ...documentMetadata(body), file_size, original_file_size, original_filename, mime_type: "application/pdf" };
}

export type UploadTicket = ReturnType<typeof documentUploadMetadata> & { id: string; project_id: string; storage_path: string; exp: number };
function signature(body: string) {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!secret || secret.length < 24) throw new Error("Missing session secret");
  return crypto.createHmac("sha256", secret).update(`portal-document-upload:${body}`).digest("base64url");
}
export function signUploadTicket(ticket: UploadTicket) {
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  return `${body}.${signature(body)}`;
}
export function readUploadTicket(value: unknown, projectId: string): UploadTicket {
  if (typeof value !== "string" || value.length > 16000) throw new DocumentError("Invalid upload ticket.");
  const parts = value.split(".");
  if (parts.length !== 2) throw new DocumentError("Invalid upload ticket.");
  const expected = Buffer.from(signature(parts[0]));
  const actual = Buffer.from(parts[1]);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) throw new DocumentError("Invalid upload ticket.");
  let ticket: UploadTicket;
  try { ticket = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")); }
  catch { throw new DocumentError("Invalid upload ticket."); }
  if (ticket.project_id !== projectId || !Number.isFinite(ticket.exp) || ticket.exp < Date.now()) throw new DocumentError("This upload has expired. Select the file and try again.");
  if (ticket.storage_path !== `${projectId}/${ticket.id}.pdf`) throw new DocumentError("Invalid upload path.");
  return ticket;
}
