import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { Plus, MoreVertical, FileText, CheckCircle2, BarChart3, Inbox, Copy, Archive, Trash2, Pencil, Eye, ArrowUp, ArrowDown, Share2, Building2, Package, AlertTriangle, ArrowLeft, X, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, Modal, SlideOver } from "@/components/ui-kit";
import { useStore, type FormStatus, type FormKind } from "@/lib/forms-store";
import { getActionLabel, type CrmAction } from "@/lib/crm-catalog";
import { detectHighVolume, bulkPostTradeShowFlow, type BulkOptions, type HighVolume } from "@/lib/kaiActions";

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
  // Template chooser. `chooser.outcome` of "" means start at Step 1 (outcome list).
  const [chooser, setChooser] = useState<{ open: boolean; outcome: string }>({ open: false, outcome: "" });
  // Kai post-trade-show prompt (dismissible per session).
  const [kaiPromptDismissed, setKaiPromptDismissed] = useState(false);
  const highVol = useMemo(() => detectHighVolume(store), [store]);

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

  // Step 3 — clone a seed form into a new draft and open the builder.
  const useTemplate = (seedId: string) => {
    const f = store.cloneForm(seedId) ?? store.createForm();
    setChooser({ open: false, outcome: "" });
    navigate({ to: "/forms/builder/$formId", params: { formId: f.id } });
  };

  const createBlank = () => {
    const f = store.createForm();
    setChooser({ open: false, outcome: "" });
    navigate({ to: "/forms/builder/$formId", params: { formId: f.id } });
  };

  // Outcome cards either open Step 2 or, for "blank", skip straight to the builder.
  const pickOutcome = (key: string) => {
    if (key === "blank") return createBlank();
    setChooser({ open: true, outcome: key });
  };

  // For 5+ forms: suggest templates whose CRM action the user hasn't built yet.
  const suggestions = useMemo(() => {
    if (store.forms.length < 5) return [];
    const builtActions = new Set(store.forms.map((f) => f.crm.action));
    return ALL_TEMPLATES.filter((t) => !builtActions.has(t.action)).slice(0, 4);
  }, [store.forms]);

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms" }]}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Forms</h1>
          <Btn onClick={() => setChooser({ open: true, outcome: "" })}><Plus className="h-4 w-4" />New Form</Btn>
        </div>

        {highVol && !kaiPromptDismissed && (
          <KaiTradeShowPrompt store={store} highVol={highVol} onDismiss={() => setKaiPromptDismissed(true)} />
        )}

        {suggestions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested templates</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {suggestions.map((t) => (
                <button
                  key={t.seedId}
                  onClick={() => useTemplate(t.seedId)}
                  className="group flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5"
                >
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="text-[11px] text-muted-foreground">{t.description}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 group-hover:opacity-100">Use template <ArrowRight className="h-3 w-3" /></span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={FileText} label="Total Forms" value={stats.total} tint="primary" />
          <StatCard icon={CheckCircle2} label="Published" value={stats.published} tint="primary" />
          <StatCard icon={Inbox} label="Submissions (30d)" value={stats.submissions30d} tint="info" />
          <StatCard icon={BarChart3} label="Avg. Conversion Rate" value={stats.conversion + "%"} tint="warning" />
        </div>

        {store.forms.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-1 text-base font-semibold text-foreground">Create your first form</div>
            <p className="mb-4 text-sm text-muted-foreground">Pick what this form is for — we'll start you with a matching template.</p>
            <OutcomeGrid onPick={pickOutcome} />
          </div>
        ) : (
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
                <th className="px-5 py-3 text-left font-medium">CRM Action</th>
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
                  <td className="px-5 py-3 text-muted-foreground">{getActionLabel(f.crm.action)}</td>
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
                <tr><td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">No forms match the filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        )}
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

      <NewFormDialog
        open={chooser.open}
        outcome={chooser.outcome}
        onOutcome={(key) => setChooser({ open: true, outcome: key })}
        onBack={() => setChooser({ open: true, outcome: "" })}
        onClose={() => setChooser({ open: false, outcome: "" })}
        onUseTemplate={useTemplate}
        onBlank={createBlank}
      />
    </AppShell>
  );
}

// ── Template-led new-form flow ───────────────────────────────────────────────

type Template = { seedId: string; name: string; description: string; action: CrmAction };
type Outcome = { key: string; Icon: typeof FileText; heading: string; blurb: string; templates: Template[] };

const OUTCOMES: Outcome[] = [
  {
    key: "accounts", Icon: Building2, heading: "Capture new accounts",
    blurb: "Trade show leads, dealer applications, contact-us inquiries",
    templates: [
      { seedId: "f_trade_show", name: "Trade Show Lead Capture", description: "Capture leads at trade shows in seconds.", action: "create_retailer_account" },
      { seedId: "f_dealer_app", name: "Dealer / Reseller Application", description: "Apply to become an authorized dealer.", action: "create_retailer_account" },
      { seedId: "f_contact", name: "Contact Us", description: "Website contact-us inquiry.", action: "create_retailer_account" },
      { seedId: "f_catalog", name: "Catalog Request", description: "Request our latest product catalog.", action: "log_campaign_response" },
    ],
  },
  {
    key: "orders", Icon: Package, heading: "Take orders or quotes",
    blurb: "RFQs, custom orders, reorders, standing order setups",
    templates: [
      { seedId: "f_rfq", name: "Request for Quote", description: "Let buyers request a custom quote.", action: "create_quote" },
      { seedId: "f_standing_order", name: "Standing Order Setup", description: "Set up a recurring standing order.", action: "create_order" },
      { seedId: "f_sample_request", name: "Sample Request", description: "Request product samples for evaluation.", action: "create_order" },
    ],
  },
  {
    key: "issues", Icon: AlertTriangle, heading: "Handle issues",
    blurb: "Claims, returns, complaints, support tickets",
    templates: [
      { seedId: "f_claim", name: "Claim / RMA", description: "File a damage, defect, or shortage claim.", action: "create_claim" },
      { seedId: "f_ticket", name: "Support Ticket", description: "Log a support request, question, or dispute.", action: "create_ticket" },
    ],
  },
  {
    key: "surveys", Icon: BarChart3, heading: "Run surveys and campaigns",
    blurb: "NPS surveys, ABR intake, catalog requests, feedback",
    templates: [
      { seedId: "f_abr", name: "Annual Business Review Intake", description: "Collect annual business review feedback.", action: "log_touchpoint" },
      { seedId: "f_feedback", name: "Post-Purchase Feedback (NPS)", description: "Tell us how we did.", action: "log_campaign_response" },
    ],
  },
  {
    key: "blank", Icon: Pencil, heading: "Something else",
    blurb: "Start with a blank form and configure it yourself",
    templates: [],
  },
];

const ALL_TEMPLATES: Template[] = OUTCOMES.flatMap((o) => o.templates);

function actionBadge(action: CrmAction): string {
  if (action === "none") return "No CRM record";
  return "→ " + getActionLabel(action).replace(/^Create /, "Creates ").replace(/^Log /, "Logs ");
}

function OutcomeGrid({ onPick }: { onPick: (key: string) => void }) {
  return (
    <div className="space-y-2">
      {OUTCOMES.map((o) => (
        <button
          key={o.key}
          onClick={() => onPick(o.key)}
          className="group flex w-full items-start gap-3 rounded-lg border border-border p-3 text-left hover:border-primary hover:bg-primary/5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary">
            <o.Icon className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">{o.heading}</span>
            <span className="block text-xs text-muted-foreground">{o.blurb}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function NewFormDialog({
  open, outcome, onOutcome, onBack, onClose, onUseTemplate, onBlank,
}: {
  open: boolean;
  outcome: string;
  onOutcome: (key: string) => void;
  onBack: () => void;
  onClose: () => void;
  onUseTemplate: (seedId: string) => void;
  onBlank: () => void;
}) {
  const current = OUTCOMES.find((o) => o.key === outcome);
  const onStep2 = !!current && current.key !== "blank";

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40" />
        <Dialog.Content className="fixed inset-0 z-50 flex flex-col bg-background focus:outline-none">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              {onStep2 && (
                <button onClick={onBack} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Back">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {onStep2 ? current!.heading : "What's this form for?"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-2xl">
              {!onStep2 ? (
                <OutcomeGrid onPick={onOutcome} />
              ) : (
                <div className="space-y-3">
                  <Dialog.Description className="text-sm text-muted-foreground">
                    Choose a template to start from — you can change everything later.
                  </Dialog.Description>
                  {current!.templates.map((t) => (
                    <div key={t.seedId} className="flex items-center justify-between gap-3 rounded-lg border border-border p-4">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                        <span className="mt-1.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{actionBadge(t.action)}</span>
                      </div>
                      <Btn onClick={() => onUseTemplate(t.seedId)}>Use template</Btn>
                    </div>
                  ))}
                  <button onClick={onBlank} className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                    …or start from a blank form instead
                  </button>
                </div>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function KaiTradeShowPrompt({ store, highVol, onDismiss }: { store: ReturnType<typeof useStore>; highVol: HighVolume; onDismiss: () => void }) {
  const [busy, setBusy] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [opts, setOpts] = useState<Required<BulkOptions>>({ logTouchpoint: true, draftEmail: true, createTask: true, flagHighValue: true });

  const run = (useOpts: BulkOptions) => {
    setBusy(true);
    setCustomize(false);
    // Brief "Setting up…" delay so the proactive action feels real.
    setTimeout(() => {
      const res = bulkPostTradeShowFlow(store, highVol.formId, useOpts, highVol.count);
      setBusy(false);
      onDismiss();
      const parts: string[] = [];
      if (res.touchpoints) parts.push(`${res.touchpoints} touchpoints logged`);
      if (res.emails) parts.push(`${res.emails} follow-up emails drafted (review in Outbox)`);
      if (res.tasks) parts.push(`${res.tasks} tasks created`);
      if (res.flagged) parts.push(`${res.flagged} flagged high-priority`);
      toast.success("Done.", { description: parts.join(", ") + "." });
    }, 1200);
  };

  const ACTIONS = [
    { key: "logTouchpoint" as const, label: 'Log a "Show booth conversation" touchpoint for each' },
    { key: "draftEmail" as const, label: "Draft a personalized follow-up email per prospect (you review before sending)" },
    { key: "createTask" as const, label: "Create a 7-day follow-up task for each, assigned to the capturing rep" },
    { key: "flagHighValue" as const, label: "Flag any prospects above $200K estimated volume as high-priority" },
  ];

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-start gap-2">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-purple-900">
            Kai noticed: You captured {highVol.count} prospects from “{highVol.formName}” in the last 2 days. Want me to organize the follow-up?
          </p>
          <ul className="mt-2 space-y-0.5 text-[12px] text-purple-800">
            {ACTIONS.map((a) => <li key={a.key} className="flex gap-1.5"><span>▸</span>{a.label}</li>)}
          </ul>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn size="sm" onClick={() => run({ logTouchpoint: true, draftEmail: true, createTask: true, flagHighValue: true })} disabled={busy}>
              {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Setting up…</> : "Set it all up"}
            </Btn>
            <button onClick={() => setCustomize(true)} disabled={busy} className="text-xs font-medium text-purple-700 hover:underline disabled:opacity-50">Customize</button>
            <button onClick={onDismiss} disabled={busy} className="text-xs font-medium text-purple-700 hover:underline disabled:opacity-50">Not now</button>
          </div>
        </div>
      </div>

      <SlideOver
        open={customize}
        onClose={() => setCustomize(false)}
        title="Customize follow-up"
        width={460}
        footer={
          <div className="flex w-full items-center justify-end gap-3">
            <button onClick={() => setCustomize(false)} className="text-sm text-muted-foreground hover:underline">Cancel</button>
            <Btn onClick={() => run(opts)} disabled={!Object.values(opts).some(Boolean)}>Run selected</Btn>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Applies to all {highVol.count} prospects from “{highVol.formName}”. Toggle the actions you want.</p>
          {ACTIONS.map((a) => (
            <label key={a.key} className="flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-primary"
                checked={opts[a.key]}
                onChange={(e) => setOpts((p) => ({ ...p, [a.key]: e.target.checked }))}
              />
              <span>{a.label}</span>
            </label>
          ))}
        </div>
      </SlideOver>
    </div>
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
