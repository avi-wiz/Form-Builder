import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Download, ChevronRight, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, Modal } from "@/components/ui-kit";
import { useStore } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/$formId/submissions")({
  head: ({ params }) => ({ meta: [{ title: `Submissions · ${params.formId}` }] }),
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const { formId } = Route.useParams();
  const store = useStore();
  const form = store.getForm(formId);
  const subs = useMemo(() => store.submissions.filter((s) => s.formId === formId), [store.submissions, formId]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [assocFor, setAssocFor] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  if (!form) return <AppShell breadcrumb={[{ label: "Forms", to: "/forms" }]}><div className="p-8">Not found.</div></AppShell>;

  const exportCsv = () => {
    const headers = new Set<string>(["id", "name", "email", "status", "submittedAt"]);
    subs.forEach((s) => Object.keys(s.values).forEach((k) => headers.add(k)));
    const cols = Array.from(headers);
    const rows = [cols.join(",")].concat(subs.map((s) => cols.map((c) => {
      const v = c === "id" ? s.id : c === "name" ? s.submitterName : c === "email" ? s.submitterEmail : c === "status" ? s.status : c === "submittedAt" ? s.submittedAt : (s.values[c] ?? "");
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(",")));
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${form.slug}-submissions.csv`;
    a.click();
  };

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }, { label: "Submissions" }]}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{form.name} — Submissions</h1>
          <Btn variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export to Excel</Btn>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{ l: "Total Submissions", v: subs.length }, { l: "This Month", v: subs.length }, { l: "Conversion Rate", v: form.viewCount ? ((form.submissionCount / form.viewCount) * 100).toFixed(1) + "%" : "0%" }].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr><th className="w-6"></th><th className="px-4 py-3 text-left">ID</th><th className="px-4 py-3 text-left">Submitter</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Submitted</th><th className="px-4 py-3 text-left">Record</th><th className="px-4 py-3"></th></tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <>
                  <tr key={s.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                    <td className="pl-4">{expanded === s.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                    <td className="px-4 py-3">{s.submitterName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.submitterEmail}</td>
                    <td className="px-4 py-3"><Badge tone={s.status === "new" ? "warning" : s.status === "actioned" ? "primary" : "info"}>{s.status}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.associatedRecord ?? "— Unassociated"}</td>
                    <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); setAssocFor(s.id); }} className="text-xs text-primary hover:underline">Associate</button></td>
                  </tr>
                  {expanded === s.id && (
                    <tr key={s.id + "-x"} className="bg-muted/20"><td colSpan={8} className="px-12 py-4">
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(s.values).map(([k, v]) => (
                          <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div className="text-sm">{v}</div></div>
                        ))}
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
              {subs.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">No submissions yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={!!assocFor} onClose={() => setAssocFor(null)} title="Associate to Record"
        footer={<><Btn variant="outline" onClick={() => setAssocFor(null)}>Cancel</Btn><Btn onClick={() => setAssocFor(null)}>Done</Btn></>}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search Leads, Customers, or Deals..." className="w-full rounded-md border border-border px-3 py-2 text-sm mb-3" />
        <div className="space-y-1">
          {store.retailers.filter((c) => c.legal_name.toLowerCase().includes(search.toLowerCase())).map((c) => (
            <button key={c.id} onClick={() => { if (assocFor) store.updateSubmission(assocFor, { associatedRecord: c.id }); setAssocFor(null); }}
              className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left hover:border-primary">
              <div><Badge tone="info">Retailer</Badge><span className="ml-2 text-sm font-medium">{c.legal_name}</span><div className="text-xs text-muted-foreground">{c.email}</div></div>
              <Btn size="sm">Associate</Btn>
            </button>
          ))}
        </div>
      </Modal>
    </AppShell>
  );
}
