"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, ArrowRight, Building2, ChevronDown, CircleDollarSign, CreditCard, FileSpreadsheet,
  Filter, LogOut, Menu, Pencil, Plus, ReceiptIndianRupee, Search, Trash2, WalletCards, X
} from "lucide-react";
import type { EntryCategory, PortalEntry, PortalPayment, PortalProject, PortalRole, ProjectDetail } from "@/lib/portal-types";
import styles from "@/app/portal/portal.module.css";
import DocumentsView from "./DocumentsView";

type Tab = "overview" | "entries" | "payments" | "statement" | "documents" | "settings";
type LoginMode = "admin" | "client";

type ModalState =
  | { type: "entry"; entry?: PortalEntry }
  | { type: "payment" }
  | { type: "project" }
  | null;

const expenseCategories: EntryCategory[] = ["Material", "Labour", "Food", "Rent", "Others"];
const allCategories: EntryCategory[] = [...expenseCategories, "Service Charge"];

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function money(value: number) { return currency.format(Number(value || 0)); }
function dateText(value: string | null | undefined) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-").map(Number);
  return dateFormat.format(new Date(Date.UTC(y, m - 1, d)));
}
function today() { return new Date().toISOString().slice(0, 10); }

function summarize(detail: ProjectDetail | null) {
  if (!detail) return { expenseTotal: 0, serviceCharge: 0, projectCost: 0, received: 0, balance: 0, byCategory: {} as Record<string, number> };
  const byCategory: Record<string, number> = Object.fromEntries(allCategories.map(c => [c, 0]));
  detail.entries.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount); });
  const serviceCharge = byCategory["Service Charge"] || 0;
  const expenseTotal = expenseCategories.reduce((sum, c) => sum + (byCategory[c] || 0), 0);
  const projectCost = expenseTotal + serviceCharge;
  const received = detail.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return { expenseTotal, serviceCharge, projectCost, received, balance: received - projectCost, byCategory };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error || "Something went wrong.");
  return body as T;
}

export default function PortalApp() {
  const [booting, setBooting] = useState(true);
  const [role, setRole] = useState<PortalRole | null>(null);
  const [projects, setProjects] = useState<PortalProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function loadProjects(sessionRole = role) {
    const data = await api<{ projects: PortalProject[] }>("/api/portal/projects");
    setProjects(data.projects);
    const preferred = sessionRole === "client" ? data.projects[0]?.id : activeId || data.projects[0]?.id;
    if (preferred) {
      setActiveId(preferred);
      await loadDetail(preferred);
    } else {
      setActiveId(null);
      setDetail(null);
    }
  }

  async function loadDetail(id: string) {
    const data = await api<ProjectDetail>(`/api/portal/projects/${id}`);
    setDetail(data);
  }

  useEffect(() => {
    (async () => {
      try {
        const session = await api<{ authenticated: true; role: PortalRole; projectId?: string }>("/api/portal/session");
        setRole(session.role);
        const projectData = await api<{ projects: PortalProject[] }>("/api/portal/projects");
        setProjects(projectData.projects);
        const id = session.role === "client" ? session.projectId || projectData.projects[0]?.id : projectData.projects[0]?.id;
        if (id) { setActiveId(id); await loadDetail(id); }
      } catch {
        setRole(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function selectProject(id: string) {
    setActiveId(id); setTab("overview"); setSidebarOpen(false); setError("");
    try { await loadDetail(id); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load project."); }
  }

  async function logout() {
    await api("/api/portal/logout", { method: "POST" });
    setRole(null); setProjects([]); setDetail(null); setActiveId(null); setTab("overview");
  }

  if (booting) return <LoadingScreen />;
  if (!role) return <LoginScreen onLogin={async (nextRole) => { setRole(nextRole); await loadProjects(nextRole); }} />;

  return (
    <div className={styles.portal}>
      {role === "admin" && (
        <AdminSidebar
          projects={projects}
          activeId={activeId}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSelect={selectProject}
          onNew={() => setModal({ type: "project" })}
          onLogout={logout}
        />
      )}
      <main className={role === "admin" ? styles.main : styles.clientMain}>
        <PortalTopbar role={role} project={detail?.project || null} onMenu={() => setSidebarOpen(true)} onLogout={logout} />
        {error && <div className={styles.errorBanner}>{error}</div>}
        {!detail ? (
          <EmptyState role={role} onNew={() => setModal({ type: "project" })} />
        ) : (
          <ProjectWorkspace
            role={role}
            detail={detail}
            tab={tab}
            setTab={setTab}
            onAddEntry={() => setModal({ type: "entry" })}
            onEditEntry={(entry) => setModal({ type: "entry", entry })}
            onAddPayment={() => setModal({ type: "payment" })}
            onDeleteEntry={async (entryId) => {
              if (!activeId || !confirm("Delete this entry?")) return;
              await api(`/api/portal/projects/${activeId}/entries/${entryId}`, { method: "DELETE" });
              await loadDetail(activeId);
            }}
            onDeletePayment={async (paymentId) => {
              if (!activeId || !confirm("Delete this payment?")) return;
              await api(`/api/portal/projects/${activeId}/payments/${paymentId}`, { method: "DELETE" });
              await loadDetail(activeId);
            }}
            onProjectSaved={async () => { if (activeId) { await loadProjects(role); await loadDetail(activeId); } }}
            onProjectDeleted={async () => {
              if (!activeId) return;
              const deletedId = activeId;
              await api(`/api/portal/projects/${deletedId}`, { method: "DELETE" });
              const data = await api<{ projects: PortalProject[] }>("/api/portal/projects");
              setProjects(data.projects);
              const nextId = data.projects[0]?.id || null;
              setActiveId(nextId);
              setTab("overview");
              if (nextId) await loadDetail(nextId);
              else setDetail(null);
            }}
          />
        )}
      </main>

      {modal && activeId && modal.type === "entry" && (
        <EntryModal
          entry={modal.entry}
          onClose={() => setModal(null)}
          onSave={async (payload) => {
            setBusy(true); setError("");
            try {
              if (modal.entry) await api(`/api/portal/projects/${activeId}/entries/${modal.entry.id}`, { method: "PATCH", body: JSON.stringify(payload) });
              else await api(`/api/portal/projects/${activeId}/entries`, { method: "POST", body: JSON.stringify(payload) });
              setModal(null); await loadDetail(activeId);
            } catch (e) { setError(e instanceof Error ? e.message : "Unable to save entry."); }
            finally { setBusy(false); }
          }} busy={busy}
        />
      )}
      {modal && activeId && modal.type === "payment" && (
        <PaymentModal
          onClose={() => setModal(null)} busy={busy}
          onSave={async (payload) => {
            setBusy(true); setError("");
            try {
              await api(`/api/portal/projects/${activeId}/payments`, { method: "POST", body: JSON.stringify(payload) });
              setModal(null); await loadDetail(activeId);
            } catch (e) { setError(e instanceof Error ? e.message : "Unable to save payment."); }
            finally { setBusy(false); }
          }}
        />
      )}
      {modal?.type === "project" && (
        <ProjectModal
          busy={busy} onClose={() => setModal(null)}
          onSave={async (payload) => {
            setBusy(true); setError("");
            try {
              const res = await api<{ project: PortalProject }>("/api/portal/projects", { method: "POST", body: JSON.stringify(payload) });
              setModal(null); await loadProjects("admin"); await selectProject(res.project.id);
            } catch (e) { setError(e instanceof Error ? e.message : "Unable to create project."); }
            finally { setBusy(false); }
          }}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return <div className={styles.loading}><Image className={styles.loadingLogo} src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={220} height={62} priority/><p>Loading Modex Portal…</p></div>;
}

function LoginScreen({ onLogin }: { onLogin: (role: PortalRole) => Promise<void> }) {
  const [mode, setMode] = useState<LoginMode>("client");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault(); if (!code.trim()) return;
    setBusy(true); setError("");
    try {
      const result = await api<{ role: PortalRole }>("/api/portal/login", { method: "POST", body: JSON.stringify({ mode, code }) });
      await onLogin(result.role);
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }

  return <div className={styles.loginPage}>
    <section className={styles.loginIntro}>
      <div className={styles.brandLockup}><Image className={styles.loginLogo} src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={250} height={70} priority/></div>
      <div className={styles.loginCopy}>
        <span className={styles.eyebrow}>PROJECT ACCOUNT PORTAL</span>
        <h1>Your project accounts,<br/><em>clear and always available.</em></h1>
        <p>Modex updates the entries. Clients simply sign in and see the latest expenses, payments and balance.</p>
      </div>
      <div className={styles.loginFeatureRow}><span>Simple</span><span>Transparent</span><span>Up to date</span></div>
    </section>
    <section className={styles.loginPanel}>
      <div className={styles.loginCard}>
        <div className={styles.loginTabs}>
          <button className={mode === "client" ? styles.loginTabActive : ""} onClick={() => { setMode("client"); setCode(""); setError(""); }}>Client</button>
          <button className={mode === "admin" ? styles.loginTabActive : ""} onClick={() => { setMode("admin"); setCode(""); setError(""); }}>Modex Admin</button>
        </div>
        <div className={styles.loginHeading}><span>{mode === "client" ? "CLIENT ACCESS" : "ADMIN ACCESS"}</span><h2>{mode === "client" ? "View your project" : "Manage project accounts"}</h2><p>{mode === "client" ? "Enter the project code shared by Modex." : "Use the private Modex admin passcode."}</p></div>
        <form onSubmit={submit} className={styles.loginForm}>
          <label>{mode === "client" ? "Project access code" : "Admin passcode"}</label>
          <input type={mode === "admin" ? "password" : "text"} value={code} onChange={e => setCode(mode === "client" ? e.target.value.toUpperCase() : e.target.value)} placeholder={mode === "client" ? "Enter your project access code" : "Enter passcode"} autoFocus />
          {error && <p className={styles.formError}>{error}</p>}
          <button className={styles.primaryButton} disabled={busy}>{busy ? "Signing in…" : mode === "client" ? "View project" : "Open admin workspace"}<ArrowRight size={17}/></button>
        </form>
        <p className={styles.loginHelp}>Need help? Contact Modex Engineers Architects · +91 97461 17611</p>
      </div>
    </section>
  </div>;
}

function AdminSidebar({ projects, activeId, open, onClose, onSelect, onNew, onLogout }: { projects: PortalProject[]; activeId: string | null; open: boolean; onClose: () => void; onSelect: (id: string) => void; onNew: () => void; onLogout: () => void; }) {
  return <>
    {open && <button aria-label="Close menu" className={styles.mobileScrim} onClick={onClose}/>} 
    <aside className={`${styles.sidebar} ${open ? styles.sidebarOpen : ""}`}>
      <div className={styles.sidebarBrand}><Image className={styles.sidebarLogo} src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={180} height={52}/><span className={styles.portalLabel}>PROJECT PORTAL</span><button className={styles.sidebarClose} onClick={onClose}><X size={18}/></button></div>
      <button className={styles.newProjectButton} onClick={onNew}><Plus size={16}/> New Project</button>
      <div className={styles.sidebarLabel}>PROJECTS</div>
      <nav className={styles.projectList}>{projects.map(project => <button key={project.id} onClick={() => onSelect(project.id)} className={activeId === project.id ? styles.projectActive : ""}>
        <span className={styles.projectIcon}><Building2 size={16}/></span><span><strong>{project.name}</strong><small>{project.client_name}</small></span><ArrowRight size={14}/>
      </button>)}</nav>
      <div className={styles.sidebarFoot}><button onClick={onLogout}><LogOut size={16}/> Log out</button></div>
    </aside>
  </>;
}

function PortalTopbar({ role, project, onMenu, onLogout }: { role: PortalRole; project: PortalProject | null; onMenu: () => void; onLogout: () => void; }) {
  return <header className={styles.topbar}>
    <div className={styles.topbarLeft}>
      {role === "admin" && <button className={styles.mobileMenu} onClick={onMenu}><Menu size={20}/></button>}
      {role === "client" && <div className={styles.clientBrand}><Image className={styles.topbarLogo} src="/logo/modex-logo.svg" alt="Modex Engineers Architects" width={150} height={44}/><span>PROJECT PORTAL</span></div>}
      {role === "admin" && <div><span className={styles.topLabel}>MODEX ADMIN</span><strong>{project?.name || "Project Accounts"}</strong></div>}
    </div>
    <div className={styles.topbarRight}>
      {role === "client" && project && <div className={styles.clientTopProject}><span>{project.client_name}</span><strong>{project.name}</strong></div>}
      <button className={styles.logoutButton} onClick={onLogout}><LogOut size={16}/><span>Log out</span></button>
    </div>
  </header>;
}

function EmptyState({ role, onNew }: { role: PortalRole; onNew: () => void }) {
  return <div className={styles.emptyState}><FileSpreadsheet size={38}/><h2>No project selected</h2><p>{role === "admin" ? "Create the first project to start recording expenses and payments." : "No project is linked to this access code."}</p>{role === "admin" && <button className={styles.primaryButton} onClick={onNew}><Plus size={17}/> Create Project</button>}</div>;
}

function ProjectWorkspace({ role, detail, tab, setTab, onAddEntry, onEditEntry, onAddPayment, onDeleteEntry, onDeletePayment, onProjectSaved, onProjectDeleted }: {
  role: PortalRole; detail: ProjectDetail; tab: Tab; setTab: (tab: Tab) => void; onAddEntry: () => void; onEditEntry: (entry: PortalEntry) => void; onAddPayment: () => void; onDeleteEntry: (id: string) => void; onDeletePayment: (id: string) => void; onProjectSaved: () => Promise<void>; onProjectDeleted: () => Promise<void>;
}) {
  const summary = summarize(detail);
  const clientTabs: Tab[] = ["overview", "statement", "payments", "documents"];
  const adminTabs: Tab[] = ["overview", "entries", "payments", "statement", "documents", "settings"];
  const tabs = role === "admin" ? adminTabs : clientTabs;
  const safeTab = tabs.includes(tab) ? tab : "overview";

  return <div className={styles.workspace}>
    <ProjectHeader role={role} detail={detail} summary={summary} />
    <div className={styles.tabbar}>{tabs.map(item => <button key={item} onClick={() => setTab(item)} className={safeTab === item ? styles.tabActive : ""}>{item}</button>)}</div>
    {safeTab === "overview" && <Overview role={role} detail={detail} summary={summary} onAddEntry={onAddEntry} onAddPayment={onAddPayment} />}
    {safeTab === "entries" && <EntriesTable detail={detail} role={role} onAddEntry={onAddEntry} onEdit={onEditEntry} onDelete={onDeleteEntry} />}
    {safeTab === "payments" && <PaymentsView detail={detail} role={role} onAddPayment={onAddPayment} onDelete={onDeletePayment} />}
    {safeTab === "statement" && <StatementView key={detail.project.id} detail={detail} role={role} />}
    {safeTab === "documents" && <DocumentsView key={detail.project.id} projectId={detail.project.id} role={role} />}
    {safeTab === "settings" && role === "admin" && <SettingsView project={detail.project} onSaved={onProjectSaved} onDeleted={onProjectDeleted} />}
  </div>;
}

function ProjectHeader({ role, detail, summary }: { role: PortalRole; detail: ProjectDetail; summary: ReturnType<typeof summarize> }) {
  const status = summary.balance < 0 ? "Payment Due" : summary.balance > 0 ? "Balance Available" : "Account Settled";
  return <section className={styles.projectHeader}>
    <div><span className={styles.eyebrow}>{role === "admin" ? "PROJECT ACCOUNT" : "YOUR PROJECT"}</span><h1>{detail.project.name}</h1><p>{detail.project.client_name}{detail.project.location ? ` · ${detail.project.location}` : ""} · <span>{detail.project.status}</span></p></div>
    {role === "admin" && <div className={styles.codePill}><span>CLIENT CODE</span><strong>{detail.project.access_code}</strong></div>}
    {role === "client" && <div className={`${styles.balancePill} ${summary.balance < 0 ? styles.balanceDue : styles.balanceGood}`}><span>{status}</span><strong>{money(Math.abs(summary.balance))}</strong></div>}
  </section>;
}

function MetricCards({ summary }: { summary: ReturnType<typeof summarize> }) {
  const balanceLabel = summary.balance < 0 ? "Payment Due" : summary.balance > 0 ? "Balance Available" : "Account Settled";
  return <div className={styles.metricGrid}>
    <Metric icon={<ReceiptIndianRupee size={19}/>} label="Project Cost" value={money(summary.projectCost)} />
    <Metric icon={<WalletCards size={19}/>} label="Amount Received" value={money(summary.received)} />
    <Metric icon={<CircleDollarSign size={19}/>} label={balanceLabel} value={money(Math.abs(summary.balance))} tone={summary.balance < 0 ? "due" : "good"} />
  </div>;
}
function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: "due" | "good" }) {
  return <div className={`${styles.metricCard} ${tone === "due" ? styles.metricDue : tone === "good" ? styles.metricGood : ""}`}><div className={styles.metricIcon}>{icon}</div><div><span>{label}</span><strong>{value}</strong></div></div>;
}

function Overview({ role, detail, summary, onAddEntry, onAddPayment }: { role: PortalRole; detail: ProjectDetail; summary: ReturnType<typeof summarize>; onAddEntry: () => void; onAddPayment: () => void; }) {
  const recent = detail.entries.slice(0, 6);
  const max = Math.max(...expenseCategories.map(c => summary.byCategory[c] || 0), 1);
  return <>
    <MetricCards summary={summary}/>
    {role === "admin" && <div className={styles.quickActions}><button className={styles.primaryButton} onClick={onAddEntry}><Plus size={17}/> Add Expense / Charge</button><button className={styles.secondaryButton} onClick={onAddPayment}><CreditCard size={17}/> Record Payment</button></div>}
    <div className={styles.twoColumn}>
      <section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.sectionLabel}>COST BREAKDOWN</span><h2>Where the project cost has gone</h2></div><strong>{money(summary.expenseTotal)}</strong></div>
        <div className={styles.breakdown}>{expenseCategories.map(category => { const value = summary.byCategory[category] || 0; return <div key={category} className={styles.breakdownRow}><div><span>{category}</span><strong>{money(value)}</strong></div><div className={styles.barTrack}><span style={{ width: `${Math.max(value ? 2 : 0, (value / max) * 100)}%` }}/></div></div> })}</div>
        <div className={styles.serviceChargeLine}><span>Service Charges</span><strong>{money(summary.serviceCharge)}</strong></div>
      </section>
      <section className={styles.panel}><div className={styles.panelHead}><div><span className={styles.sectionLabel}>RECENT ENTRIES</span><h2>Latest account activity</h2></div></div>
        <div className={styles.activityList}>{recent.length ? recent.map(entry => <div className={styles.activityItem} key={entry.id}><span className={styles.categoryDot}/><div><strong>{entry.particular}</strong><small>{entry.category} · {dateText(entry.entry_date)}</small></div><b>{money(entry.amount)}</b></div>) : <p className={styles.emptyText}>No entries added yet.</p>}</div>
      </section>
    </div>
  </>;
}

function EntryFilters({ query, category, onQuery, onCategory }: { query: string; category: string; onQuery: (value: string) => void; onCategory: (value: string) => void }) {
  return <div className={styles.filters}>
    <label><Search size={16}/><input aria-label="Search entries" value={query} onChange={e => onQuery(e.target.value)} placeholder="Search particular, quantity or remark"/></label>
    <label><Filter size={16}/><select aria-label="Filter entries by category" value={category} onChange={e => onCategory(e.target.value)}><option>All</option>{allCategories.map(c => <option key={c}>{c}</option>)}</select><ChevronDown size={14}/></label>
  </div>;
}

function matchesEntry(entry: PortalEntry, query: string, category: string) {
  return (category === "All" || entry.category === category) && `${entry.particular} ${entry.quantity || ""} ${entry.remarks || ""}`.toLowerCase().includes(query.trim().toLowerCase());
}

function EntriesTable({ detail, role, onAddEntry, onEdit, onDelete }: { detail: ProjectDetail; role: PortalRole; onAddEntry: () => void; onEdit: (entry: PortalEntry) => void; onDelete: (id: string) => void; }) {
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("All");
  const filtered = detail.entries.filter(e => matchesEntry(e, query, category));
  return <section className={styles.panel}>
    <div className={styles.tableToolbar}><div><span className={styles.sectionLabel}>ENTRIES</span><h2>Expense & service charge entries</h2></div>{role === "admin" && <button className={styles.primaryButton} onClick={onAddEntry}><Plus size={16}/> Add Entry</button>}</div>
    <EntryFilters query={query} category={category} onQuery={setQuery} onCategory={setCategory}/>
    <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Category</th><th>Particular</th><th>Quantity</th><th className={styles.moneyCol}>Amount</th><th>Remarks</th>{role === "admin" && <th/>}</tr></thead><tbody>{filtered.map(entry => <tr key={entry.id}><td>{dateText(entry.entry_date)}</td><td><span className={styles.categoryBadge}>{entry.category}</span></td><td><strong>{entry.particular}</strong></td><td>{entry.quantity || "—"}</td><td className={styles.moneyCol}>{money(entry.amount)}</td><td>{entry.remarks || "—"}</td>{role === "admin" && <td className={styles.rowActions}><button className={styles.editAction} onClick={() => onEdit(entry)} title="Edit entry"><Pencil size={14}/><span>Edit</span></button><button className={styles.deleteAction} onClick={() => onDelete(entry.id)} title="Delete entry"><Trash2 size={14}/><span>Delete</span></button></td>}</tr>)}</tbody></table>{!filtered.length && <p className={styles.emptyText}>No matching entries.</p>}</div>
  </section>;
}

function PaymentsView({ detail, role, onAddPayment, onDelete }: { detail: ProjectDetail; role: PortalRole; onAddPayment: () => void; onDelete: (id: string) => void; }) {
  const total = detail.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  return <section className={styles.panel}>
    <div className={styles.tableToolbar}><div><span className={styles.sectionLabel}>PAYMENTS</span><h2>{role === "client" ? "Payments received by Modex" : "Client payments received"}</h2></div><div className={styles.toolbarTotal}><span>Total Received</span><strong>{money(total)}</strong></div>{role === "admin" && <button className={styles.primaryButton} onClick={onAddPayment}><Plus size={16}/> Record Payment</button>}</div>
    <div className={styles.paymentList}>{detail.payments.map(payment => <div key={payment.id} className={styles.paymentRow}><div className={styles.paymentIcon}><CreditCard size={18}/></div><div><strong>{dateText(payment.payment_date)}</strong><span>{payment.method || "Payment"}{payment.note ? ` · ${payment.note}` : ""}</span></div><b>{money(payment.amount)}</b>{role === "admin" && <button className={styles.deleteGhost} onClick={() => onDelete(payment.id)}><Trash2 size={15}/></button>}</div>)}{!detail.payments.length && <p className={styles.emptyText}>No payments recorded yet.</p>}</div>
  </section>;
}

function StatementView({ detail, role }: { detail: ProjectDetail; role: PortalRole }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const summary = summarize(detail);
  const rows = useMemo(() => detail.entries.filter(entry => matchesEntry(entry, query, category)).sort((a,b) => b.entry_date.localeCompare(a.entry_date)), [detail.entries, query, category]);
  const filteredTotal = rows.reduce((total, entry) => total + Number(entry.amount), 0);
  const isFiltered = Boolean(query.trim()) || category !== "All";
  return <>
    <div className={styles.statementIntro}><div><span className={styles.sectionLabel}>PROJECT STATEMENT</span><h2>{role === "client" ? "A clear view of every entry" : "Live statement generated from entries"}</h2><p>No manual abstract calculations are required. The totals update automatically when Modex adds or edits an entry.</p></div><div className={styles.statementBalance}><span>{summary.balance < 0 ? "PAYMENT DUE" : "BALANCE AVAILABLE"}</span><strong>{money(Math.abs(summary.balance))}</strong></div></div>
    <MetricCards summary={summary}/>
    <section className={styles.panel}>
      <EntryFilters query={query} category={category} onQuery={setQuery} onCategory={setCategory}/>
      <div className={styles.tableToolbar}>
        <span className={styles.sectionLabel} role="status">Showing {rows.length} of {detail.entries.length} entries</span>
        {isFiltered && <button className={styles.ghostButton} onClick={() => { setQuery(""); setCategory("All"); }}><X size={14}/> Clear filters</button>}
        <div className={styles.toolbarTotal}><span>{isFiltered ? "Filtered entries total" : "All entries total"}</span><strong>{money(filteredTotal)}</strong></div>
      </div>
      <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Category</th><th>Particular</th><th>Quantity</th><th className={styles.moneyCol}>Amount</th><th>Remarks</th></tr></thead><tbody>{rows.map(e => <tr key={e.id}><td>{dateText(e.entry_date)}</td><td><span className={styles.categoryBadge}>{e.category}</span></td><td><strong>{e.particular}</strong></td><td>{e.quantity || "—"}</td><td className={styles.moneyCol}>{money(e.amount)}</td><td>{e.remarks || "—"}</td></tr>)}</tbody></table>{!rows.length && <p className={styles.emptyText}>{detail.entries.length ? "No matching entries. Try another category or clear the search." : "No entries recorded yet."}</p>}</div>
      {isFiltered && <p className={styles.emptyText}>The project totals below include all entries, regardless of the filters above.</p>}
      <div className={styles.statementTotals}><div><span>Expenses</span><strong>{money(summary.expenseTotal)}</strong></div><div><span>Service Charges</span><strong>{money(summary.serviceCharge)}</strong></div><div><span>Project Cost</span><strong>{money(summary.projectCost)}</strong></div><div><span>Received</span><strong>{money(summary.received)}</strong></div><div className={summary.balance < 0 ? styles.totalDue : styles.totalGood}><span>{summary.balance < 0 ? "Payment Due" : "Balance Available"}</span><strong>{money(Math.abs(summary.balance))}</strong></div></div>
    </section>
  </>;
}

function SettingsView({ project, onSaved, onDeleted }: { project: PortalProject; onSaved: () => Promise<void>; onDeleted: () => Promise<void> }) {
  const [form, setForm] = useState({ name: project.name, client_name: project.client_name, location: project.location || "", status: project.status, start_date: project.start_date || "", access_code: project.access_code });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setSaved(false);
    try {
      await api(`/api/portal/projects/${project.id}`, { method: "PATCH", body: JSON.stringify(form) });
      await onSaved();
      setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  async function deleteProject() {
    const first = confirm(`Delete “${project.name}”?\n\nThis will permanently delete all entries and payments for this project.`);
    if (!first) return;
    const typed = prompt(`For safety, type DELETE to permanently remove “${project.name}”.`);
    if (typed !== "DELETE") return;
    setDeleting(true);
    try {
      await onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  return <div className={styles.settingsStack}>
    <section className={`${styles.panel} ${styles.settingsPanel}`}>
      <div><span className={styles.sectionLabel}>PROJECT SETTINGS</span><h2>Project details & client access</h2></div>
      <form onSubmit={submit} className={styles.settingsForm}>
        <Field label="Project Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Field>
        <Field label="Client Name"><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}/></Field>
        <Field label="Location"><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></Field>
        <Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Ongoing</option><option>On Hold</option><option>Completed</option></select></Field>
        <Field label="Start Date"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}/></Field>
        <Field label="Client Access Code"><input className={styles.codeInput} value={form.access_code} onChange={e => setForm({ ...form, access_code: e.target.value.toUpperCase() })}/></Field>
        <div className={styles.formActions}><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Save Changes"}</button>{saved && <span className={styles.savedText}>Saved</span>}</div>
      </form>
    </section>

    <section className={styles.dangerPanel}>
      <div>
        <span className={styles.sectionLabel}>DANGER ZONE</span>
        <h2>Delete this project</h2>
        <p>This permanently removes the project, all expense/service-charge entries and all recorded payments. This cannot be undone.</p>
      </div>
      <button type="button" className={styles.dangerButton} onClick={deleteProject} disabled={deleting}><Trash2 size={16}/>{deleting ? "Deleting…" : "Delete Project"}</button>
    </section>
  </div>;
}

function EntryModal({ entry, onClose, onSave, busy }: { entry?: PortalEntry; onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void>; busy: boolean; }) {
  const [form, setForm] = useState({ entry_date: entry?.entry_date || today(), category: entry?.category || "Material", particular: entry?.particular || "", quantity: entry?.quantity || "", amount: entry?.amount?.toString() || "", remarks: entry?.remarks || "" });
  return <Modal title={entry ? "Edit Entry" : "Add Expense / Service Charge"} subtitle="Enter the same information you currently maintain in Excel." onClose={onClose}><form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }); }} className={styles.modalForm}><div className={styles.formTwo}><Field label="Date"><input type="date" value={form.entry_date} onChange={e => setForm({ ...form, entry_date: e.target.value })} required/></Field><Field label="Category"><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as EntryCategory })}>{allCategories.map(c => <option key={c}>{c}</option>)}</select></Field></div><Field label="Particular"><input value={form.particular} onChange={e => setForm({ ...form, particular: e.target.value })} placeholder="e.g. Cement, Stone masonry, Permit" required/></Field><div className={styles.formTwo}><Field label="Quantity / Reference"><input value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 50 Bags, Bill"/></Field><Field label="Amount"><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" required/></Field></div><Field label="Remarks"><input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} placeholder="Optional note"/></Field><div className={styles.modalActions}><button type="button" className={styles.ghostButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : entry ? "Save Entry" : "Add Entry"}</button></div></form></Modal>;
}

function PaymentModal({ onClose, onSave, busy }: { onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void>; busy: boolean; }) {
  const [form, setForm] = useState({ payment_date: today(), amount: "", method: "Bank Transfer", note: "" });
  return <Modal title="Record Client Payment" subtitle="Add money received from the client. The balance updates automatically." onClose={onClose}><form onSubmit={e => { e.preventDefault(); onSave({ ...form, amount: Number(form.amount) }); }} className={styles.modalForm}><div className={styles.formTwo}><Field label="Date"><input type="date" value={form.payment_date} onChange={e => setForm({ ...form, payment_date: e.target.value })}/></Field><Field label="Amount Received"><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" required/></Field></div><Field label="Payment Method"><select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}><option>Bank Transfer</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>Other</option></select></Field><Field label="Reference / Note"><input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Optional"/></Field><div className={styles.modalActions}><button type="button" className={styles.ghostButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={busy}>{busy ? "Saving…" : "Record Payment"}</button></div></form></Modal>;
}

function ProjectModal({ onClose, onSave, busy }: { onClose: () => void; onSave: (payload: Record<string, unknown>) => Promise<void>; busy: boolean; }) {
  const [form, setForm] = useState({ name: "", client_name: "", location: "Kasaragod, Kerala", start_date: today(), status: "Ongoing", access_code: "" });
  return <Modal title="Create New Project" subtitle="Create one client account and start adding their entries." onClose={onClose}><form onSubmit={e => { e.preventDefault(); onSave(form); }} className={styles.modalForm}><Field label="Project Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. MA & MA Residence" required/></Field><Field label="Client Name"><input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Client name" required/></Field><Field label="Location"><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}/></Field><div className={styles.formTwo}><Field label="Start Date"><input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}/></Field><Field label="Status"><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option>Ongoing</option><option>On Hold</option><option>Completed</option></select></Field></div><Field label="Client Access Code (optional)"><input className={styles.codeInput} value={form.access_code} onChange={e => setForm({ ...form, access_code: e.target.value.toUpperCase() })} placeholder="Leave blank to generate automatically"/></Field><div className={styles.modalActions}><button type="button" className={styles.ghostButton} onClick={onClose}>Cancel</button><button className={styles.primaryButton} disabled={busy}>{busy ? "Creating…" : "Create Project"}</button></div></form></Modal>;
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) {
  return <div className={styles.modalBackdrop} role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className={styles.modal} role="dialog" aria-modal="true"><div className={styles.modalHead}><div><span className={styles.sectionLabel}>MODEX PORTAL</span><h2>{title}</h2><p>{subtitle}</p></div><button onClick={onClose}><X size={20}/></button></div>{children}</div></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className={styles.field}><span>{label}</span>{children}</label>; }
