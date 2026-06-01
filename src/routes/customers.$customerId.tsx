import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Mail, ChevronDown, ChevronRight, FileText } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge } from "@/components/ui-kit";
import { useStore } from "@/lib/forms-store";

export const Route = createFileRoute("/customers/$customerId")({
  head: () => ({ meta: [{ title: "Customer" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const { customerId } = Route.useParams();
  const store = useStore();
  const c = store.customers.find((x) => x.id === customerId) ?? store.customers[0];
  const subs = useMemo(() => store.submissions.filter((s) => s.associatedRecord === c.id), [store.submissions, c.id]);
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState("forms");

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Customers" }, { label: c.name }]}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{c.name}</h1>
          <Btn>Create Order</Btn>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning font-semibold">{c.name.slice(0, 2)}</div>
              <div><div className="font-semibold">{c.name}</div><div className="text-xs text-muted-foreground">{c.code}</div></div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row k="Customer ID" v={<span className="flex items-center gap-1">{c.code}<Copy className="h-3 w-3 text-muted-foreground" /></span>} />
              <Row k="Pricelist" v={c.pricelist} />
              <Row k="Sales Rep" v={c.salesRep} />
              <Row k="Email ID" v={<span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>} />
            </div>
          </div>
          <div>
            <div className="flex gap-4 border-b border-border text-sm">
              {[["sales", "Sales"], ["deals", "Deals"], ["activity", "Activity"], ["notes", "Notes"], ["forms", "Form Submissions"]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`pb-2 ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="pt-5">
              {tab !== "forms" && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">{tab} content (placeholder)</div>}
              {tab === "forms" && (
                <div className="space-y-3">
                  {subs.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
                      <FileText className="mx-auto mb-2 h-8 w-8" /> No form submissions yet
                    </div>
                  )}
                  {subs.map((s) => {
                    const f = store.getForm(s.formId);
                    const exp = open === s.id;
                    return (
                      <div key={s.id} className="rounded-xl border border-border bg-card">
                        <button onClick={() => setOpen(exp ? null : s.id)} className="flex w-full items-center justify-between p-4 text-left">
                          <div>
                            <div className="font-semibold">{f?.name}</div>
                            <div className="text-xs text-muted-foreground">{new Date(s.submittedAt).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge tone={s.status === "new" ? "warning" : "primary"}>{s.status}</Badge>
                            {exp ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </div>
                        </button>
                        {exp && (
                          <div className="grid grid-cols-2 gap-3 border-t border-border p-4 text-sm">
                            {Object.entries(s.values).map(([k, v]) => (
                              <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div>{v}</div></div>
                            ))}
                            {f && <Link to="/forms/$formId/submissions" params={{ formId: f.id }} className="text-xs text-primary hover:underline col-span-2">View all submissions →</Link>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span></div>;
}
