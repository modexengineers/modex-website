export type PortalRole = "admin" | "client";
export type EntryCategory = "Material" | "Labour" | "Food" | "Rent" | "Others" | "Service Charge";

export type PortalProject = {
  id: string;
  name: string;
  client_name: string;
  location: string | null;
  status: string;
  access_code: string;
  start_date: string | null;
  created_at: string;
  updated_at: string;
};

export type PortalEntry = {
  id: string;
  project_id: string;
  entry_date: string;
  category: EntryCategory;
  particular: string;
  quantity: string | null;
  amount: number;
  remarks: string | null;
  created_at: string;
};

export type PortalPayment = {
  id: string;
  project_id: string;
  payment_date: string;
  amount: number;
  method: string | null;
  note: string | null;
  created_at: string;
};

export type ProjectDetail = {
  project: PortalProject;
  entries: PortalEntry[];
  payments: PortalPayment[];
};

export type PortalSession = {
  role: PortalRole;
  projectId?: string;
};
