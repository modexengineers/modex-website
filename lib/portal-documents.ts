export const DOCUMENT_BUCKET = "portal-documents";
// Decimal MB, matching the SQL constraint supplied for portal_documents.
export const DOCUMENT_LIMIT = 5_000_000;
export const SOURCE_LIMIT = 50_000_000;
export const DOCUMENT_CATEGORIES = ["Plans", "Designs", "Approvals", "Agreements", "Bills", "Other"] as const;
export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

export type PortalDocument = {
  id: string;
  project_id: string;
  title: string;
  category: DocumentCategory;
  revision: string;
  notes: string | null;
  original_filename: string;
  mime_type: string;
  file_size: number;
  original_file_size: number | null;
  created_at: string;
};

export function documentSize(bytes: number) {
  return bytes < 1_000_000 ? `${Math.ceil(bytes / 1000)} KB` : `${(bytes / 1_000_000).toFixed(2)} MB`;
}
