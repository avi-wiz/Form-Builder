import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, MoreVertical, FileText, CheckCircle2, BarChart3, Inbox, Copy, Archive, Trash2, Pencil, Eye, ArrowUp, ArrowDown, Share2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, Modal } from "@/components/ui-kit";
import { useStore, type FormStatus, type FormKind } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/")({
  head: () => ({ meta: [{ title: "Forms · WizCommerce" }, { name: "description", content: "Manage all forms across your wholesale workspace." }] }),
  component: FormsDashboard,
});

const STATUS_TONE: Record<FormStatus, "primary" | "neutral" | "outline"> = {
  published: "primary", draft: "outline", archived: "neutral",
};

function FormsDashboard() {
  const store = useStore();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<"all" | FormStatus>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | FormKind>("all");
  const [sort, setSort] = useState<{ key: "updatedAt" | "name" | "submissionCount" | "createdAt"; dir: "asc" | "desc" }>({ key: "updatedAt", dir: "desc" });
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const stats = useMemo(() => {
    const f = store.forms;
    return {
      total: f.length,
      published: f.filter((x) => x.status === "published").length,
      submissions30d: f.reduce((a, b) => a + b.submissionCount, 0),
      conversion: f.length ? (f.reduce((a, b) => a + (b.viewCount ? b.submissionCount / b.viewCount : 0), 0) / f.length * 100).toFixed(1) : "0.0",
    };
  }, [store.forms]);

  const rows = useMemo(() => {
    let r = store.forms.slice();
    if (statusFilter !== "all") r = r.filter((f) => f.status === statusFilter);
    if (typeFilter !== "all") r = r.filter((f) => f.kind === typeFilter);
    const dir = sort.dir === "asc" ? 1 : -1;
    r.sort((a, b) => {
      if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
      if (sort.key === "submissionCount") return (a.submissionCount - b.submissionCount) * dir;
      if (sort.key === "createdAt") return a.createdAt.localeCompare(b.createdAt) * dir;
      return a.updatedAt.localeCompare(b.updatedAt) * dir;
    });
    return r;
  }, [store.forms, statusFilter, typeFilter, sort]);

  const handleCreate = () => {
    const f = store.createForm();
    navigate({ to: "/forms/builder/$formId", params: { formId: f.id } });
  };

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms" }]}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Forms</h1>
          <Btn onClick={handleCreate}><Plus className="h-4 w-4" />Create Form</Btn>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="Total Forms" value={stats.total} tint="primary" />
          <StatCard icon={CheckCircle2} label="Published" value={stats.published} tint="primary" />
          <StatCard icon={Inbox} label="Submissions (30d)" value={stats.submissions30d} tint="info" />
          <StatCard icon={BarChart3} label="Avg. Conversion Rate" value={stats.conversion + "%"} tint="warning" />
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
            <span className="text-sm font-medium text-foreground">All Forms</span>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onChange={(v) => setStatusFilter(v as never)} options={[
                { value: "all", label: "All Statuses" }, { value: "published", label: "Published" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" },
              ]} />
              <Select value={typeFilter} onChange={(v) => setTypeFilter(v as never)} options={[
                { value: "all", label: "All Types" }, { value: "Lead Capture", label: "Lead Capture" }, { value: "Contact", label: "Contact" }, { value: "RFQ", label: "RFQ" }, { value: "Custom", label: "Custom" },
              ]} />
              <Select value={sort.key} onChange={(v) => setSort({ key: v as never, dir: "desc" })} options={[
                { value: "updatedAt", label: "Sort: Last Updated" }, { value: "createdAt", label: "Sort: Created" }, { value: "name", label: "Sort: Name" }, { value: "submissionCount", label: "Sort: Submissions" },
              ]} />
            </div>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <SortHeader label="Form Name" sortKey="name" sort={sort} onSort={setSort} />
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Type</th>
                <SortHeader label="Submissions (30d)" sortKey="submissionCount" sort={sort} onSort={setSort} align="right" />
                <SortHeader label="Created" sortKey="createdAt" sort={sort} onSort={setSort} />
                <SortHeader label="Last Updated" sortKey="updatedAt" sort={sort} onSort={setSort} />
                <th className="px-5 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((f) => (
                <tr key={f.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium text-foreground">
                    <Link to="/forms/builder/$formId" params={{ formId: f.id }} className="hover:text-primary">{f.name}</Link>
                  </td>
                  <td className="px-5 py-3"><Badge tone={STATUS_TONE[f.status]}>{f.status[0].toUpperCase() + f.status.slice(1)}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground">{f.kind}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{f.submissionCount}</td>
                  <td className="px-5 py-3 text-muted-foreground">{f.createdAt}</td>
                  <td className="px-5 py-3 text-muted-foreground">{f.updatedAt}</td>
                  <td className="relative px-5 py-3">
                    <button onClick={() => setOpenMenu(openMenu === f.id ? null : f.id)} className="rounded p-1 hover:bg-muted">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                    {openMenu === f.id && (
                      <div className="absolute right-5 top-10 z-10 w-48 rounded-lg border border-border bg-card shadow-lg" onMouseLeave={() => setOpenMenu(null)}>
                        <MenuItem icon={Pencil} label="Edit" onClick={() => { setOpenMenu(null); navigate({ to: "/forms/builder/$formId", params: { formId: f.id } }); }} />
                        <MenuItem icon={Share2} label="Share & Embed" onClick={() => { setOpenMenu(null); navigate({ to: "/forms/$formId/share", params: { formId: f.id } }); }} />
                        <MenuItem icon={Eye} label="Preview" onClick={() => { setOpenMenu(null); navigate({ to: "/forms/preview/$formId", params: { formId: f.id } }); }} />
                        <MenuItem icon={Inbox} label="View Submissions" onClick={() => { setOpenMenu(null); navigate({ to: "/forms/$formId/submissions", params: { formId: f.id } }); }} />
                        <MenuItem icon={Copy} label="Clone" onClick={() => { store.cloneForm(f.id); setOpenMenu(null); }} />
                        <MenuItem icon={Archive} label="Archive" onClick={() => { store.archiveForm(f.id); setOpenMenu(null); }} />
                        <MenuItem icon={Trash2} label="Delete" onClick={() => { setConfirmDelete(f.id); setOpenMenu(null); }} danger />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No forms match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete form?"
        footer={
          <>
            <Btn variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
            <Btn variant="danger" onClick={() => { if (confirmDelete) store.deleteForm(confirmDelete); setConfirmDelete(null); }}>Delete</Btn>
          </>
        }>
        This will permanently delete the form and all its submissions. This action cannot be undone.
      </Modal>
    </AppShell>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: typeof FileText; label: string; value: string | number; tint: "primary" | "info" | "warning" }) {
  const tintBg = tint === "primary" ? "bg-primary/10 text-primary" : tint === "info" ? "bg-info/10 text-info" : "bg-warning/15 text-warning";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tintBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold text-foreground">{value}</div>
        </div>
      </div>
    </div>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground hover:border-primary focus:border-primary focus:outline-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof FileText; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${danger ? "text-destructive" : "text-foreground"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function SortHeader({ label, sortKey: key, sort, onSort, align = "left" }: {
  label: string; sortKey: "updatedAt" | "name" | "submissionCount" | "createdAt"; sort: { key: "updatedAt" | "name" | "submissionCount" | "createdAt"; dir: "asc" | "desc" }; onSort: (s: { key: "updatedAt" | "name" | "submissionCount" | "createdAt"; dir: "asc" | "desc" }) => void; align?: "left" | "right";
}) {
  const active = sort.key === key;
  const handleClick = () => {
    onSort({ key, dir: active && sort.dir === "asc" ? "desc" : "asc" });
  };
  return (
    <th className={`px-5 py-3 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      <button onClick={handleClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        {active && (sort.dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
}
