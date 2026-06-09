import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Mail, ChevronDown, ChevronRight, FileText, Plus, Pencil, Phone, Users, StickyNote, CalendarDays, RefreshCw, Megaphone } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, SlideOver } from "@/components/ui-kit";
import { useStore, type Touchpoint, type StatusEvent, type CampaignResponse, type RetailerAccount } from "@/lib/forms-store";
import { getLookupPlaceholders } from "@/lib/crm-catalog";

const STATUS_LABEL: Record<RetailerAccount["opening_order_status"], string> = {
  prospect: "Prospect", opened: "Opened", active: "Active",
  dormant_90d: "Dormant (90d)", dormant_180d: "Dormant (180d)", reactivated: "Reactivated", lost: "Lost",
};

const CAMPAIGN_LABEL: Record<string, string> = {
  catalog_drop_sent: "Catalog Drop Sent",
  nps_survey_sent: "NPS Survey Sent",
  nps_response_received: "NPS Response Received",
  post_purchase_survey_sent: "Post-Purchase Survey Sent",
  post_purchase_response_received: "Post-Purchase Response Received",
  reorder_reminder_sent: "Reorder Reminder Sent",
  virtual_showroom_session: "Virtual Showroom Session",
};

type TimelineItem =
  | { kind: "touchpoint"; ts: string; data: Touchpoint }
  | { kind: "status"; ts: string; data: StatusEvent };

export const Route = createFileRoute("/retailers/$retailerId")({
  head: () => ({ meta: [{ title: "Retailer" }] }),
  component: RetailerPage,
});

const TYPE_META: Record<Touchpoint["type"], { label: string; Icon: typeof Phone }> = {
  visit: { label: "Visit", Icon: Users },
  call: { label: "Call", Icon: Phone },
  email: { label: "Email", Icon: Mail },
  meeting: { label: "Meeting", Icon: CalendarDays },
  note: { label: "Note", Icon: StickyNote },
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function RetailerPage() {
  const { retailerId } = Route.useParams();
  const store = useStore();
  const c = store.retailers.find((x) => x.id === retailerId) ?? store.retailers[0];
  const subs = useMemo(() => store.submissions.filter((s) => s.associatedRecord === c.id), [store.submissions, c.id]);
  // Merge manual touchpoints + automatic status-change events into one timeline.
  const timeline = useMemo<TimelineItem[]>(() => {
    const tps: TimelineItem[] = store.touchpoints.filter((t) => t.retailerId === c.id).map((t) => ({ kind: "touchpoint", ts: t.createdAt, data: t }));
    const ses: TimelineItem[] = store.statusEvents.filter((s) => s.retailerId === c.id).map((s) => ({ kind: "status", ts: s.createdAt, data: s }));
    return [...tps, ...ses].sort((a, b) => b.ts.localeCompare(a.ts));
  }, [store.touchpoints, store.statusEvents, c.id]);
  const campaigns = useMemo(
    () => store.campaignResponses.filter((r) => r.retailerId === c.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [store.campaignResponses, c.id],
  );
  const [open, setOpen] = useState<string | null>(null);
  const [tab, setTab] = useState("touchpoints");
  const [logging, setLogging] = useState(false);

  const onSaved = () => {
    setLogging(false);
    setTab("touchpoints");
  };

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Retailers", to: "/retailers" }, { label: c.legal_name }]}>
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h1 className="text-xl font-semibold">{c.legal_name}</h1>
          <div className="flex items-center gap-2">
            <Btn variant="outline" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</Btn>
            <Btn variant="outline" size="sm">Create Order</Btn>
            {/* Rep's primary daily action — biggest, most prominent button on the page */}
            <Btn onClick={() => setLogging(true)} className="h-11 px-5 text-base shadow-sm">
              <Plus className="h-5 w-5" /> Log Touchpoint
            </Btn>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[280px_1fr]">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/20 text-warning font-semibold">{c.legal_name.slice(0, 2)}</div>
              <div><div className="font-semibold">{c.legal_name}</div><div className="text-xs text-muted-foreground">{c.id}</div></div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <Row k="Retailer ID" v={<span className="flex items-center gap-1">{c.id}<Copy className="h-3 w-3 text-muted-foreground" /></span>} />
              <Row k="Pricelist" v={c.pricelist} />
              <Row k="Sales Rep" v={c.primary_rep} />
              <Row k="Email ID" v={<span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>} />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap gap-4 border-b border-border text-sm">
              {[["sales", "Sales"], ["touchpoints", "Touchpoints"], ["campaigns", "Campaign History"], ["forms", "Form Submissions"], ["files", "Files"], ["settings", "Settings"]].map(([k, l]) => (
                <button key={k} onClick={() => setTab(k)} className={`pb-2 ${tab === k ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{l}</button>
              ))}
            </div>
            <div className="pt-5">
              {tab === "touchpoints" && <ActivityTimeline timeline={timeline} onLog={() => setLogging(true)} />}
              {tab === "campaigns" && <CampaignHistory campaigns={campaigns} />}
              {tab === "sales" && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Orders &amp; quotes (placeholder)</div>}
              {tab === "files" && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Files — tax certs, agreements (placeholder)</div>}
              {tab === "settings" && <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Account settings (placeholder)</div>}
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

      <LogTouchpointPanel open={logging} retailerId={c.id} repName={c.primary_rep} onClose={() => setLogging(false)} onSaved={onSaved} />
    </AppShell>
  );
}

function ActivityTimeline({ timeline, onLog }: { timeline: TimelineItem[]; onLog: () => void }) {
  if (timeline.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
        <StickyNote className="mx-auto mb-2 h-8 w-8" />
        <div className="mb-3">No touchpoints logged yet</div>
        <Btn size="sm" onClick={onLog}><Plus className="h-4 w-4" /> Log Touchpoint</Btn>
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {timeline.map((item) =>
        item.kind === "status"
          ? <StatusEventRow key={item.data.id} e={item.data} />
          : <TouchpointRow key={item.data.id} t={item.data} />,
      )}
    </ol>
  );
}

function TouchpointRow({ t }: { t: Touchpoint }) {
  const meta = TYPE_META[t.type];
  const Icon = meta.Icon;
  return (
    <li className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{meta.label}</span>
          <span className="text-xs text-muted-foreground">{t.date}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{t.notes}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {t.loggedBy && <span>by {t.loggedBy}</span>}
          {t.relatedQuoteId && <Badge tone="info">Quote: {t.relatedQuoteId}</Badge>}
          {t.relatedOrderId && <Badge tone="info">Order: {t.relatedOrderId}</Badge>}
        </div>
      </div>
    </li>
  );
}

// System status-change event — lighter background, distinct icon, smaller font.
function StatusEventRow({ e }: { e: StatusEvent }) {
  return (
    <li className="flex gap-3 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1 self-center">
        <span className="text-xs font-medium text-foreground">
          Status changed: {STATUS_LABEL[e.from]} → {STATUS_LABEL[e.to]}
        </span>
        <div className="text-[11px] text-muted-foreground">Triggered by {e.triggeredBy} on {e.date}</div>
      </div>
    </li>
  );
}

function CampaignHistory({ campaigns }: { campaigns: CampaignResponse[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
        <Megaphone className="mx-auto mb-2 h-8 w-8" /> No campaign activity yet
      </div>
    );
  }
  return (
    <ol className="space-y-3">
      {campaigns.map((r) => (
        <li key={r.id} className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700">
            <Megaphone className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{CAMPAIGN_LABEL[r.responseType] ?? r.responseType}</span>
              <span className="text-xs text-muted-foreground">{r.date}</span>
            </div>
            {r.responseData && <p className="mt-0.5 text-sm text-foreground">{r.responseData}</p>}
            {r.campaignId && <div className="mt-1 text-[11px] text-muted-foreground">Campaign: {r.campaignId}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function LogTouchpointPanel({ open, retailerId, repName, onClose, onSaved }: {
  open: boolean; retailerId: string; repName?: string; onClose: () => void; onSaved: () => void;
}) {
  const store = useStore();
  const [type, setType] = useState<Touchpoint["type"]>("note");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(todayStr());
  const [linkOpen, setLinkOpen] = useState(false);
  const [relatedQuoteId, setRelatedQuoteId] = useState("");
  const [relatedOrderId, setRelatedOrderId] = useState("");

  const quotes = getLookupPlaceholders("quote");
  const orders = getLookupPlaceholders("order");

  const reset = () => {
    setType("note"); setNotes(""); setDate(todayStr());
    setLinkOpen(false); setRelatedQuoteId(""); setRelatedOrderId("");
  };

  const save = () => {
    const t: Touchpoint = {
      id: "T_" + Math.random().toString(36).slice(2, 9),
      retailerId,
      type,
      notes: notes.trim(),
      date,
      createdAt: new Date().toISOString(),
      loggedBy: repName,
      ...(relatedQuoteId ? { relatedQuoteId } : {}),
      ...(relatedOrderId ? { relatedOrderId } : {}),
    };
    store.addTouchpoint(t);
    reset();
    onSaved();
  };

  return (
    <SlideOver
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Log Touchpoint"
      width={480}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <button onClick={() => { reset(); onClose(); }} className="text-sm text-muted-foreground hover:text-foreground hover:underline">Cancel</button>
          <Btn onClick={save} disabled={!notes.trim()}>Save touchpoint</Btn>
        </div>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Type</span>
          <select value={type} onChange={(e) => setType(e.target.value as Touchpoint["type"])} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
            {(Object.keys(TYPE_META) as Touchpoint["type"][]).map((k) => (
              <option key={k} value={k}>{TYPE_META[k].label}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Notes</span>
          <textarea
            autoFocus
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            placeholder="What happened on this touchpoint?"
            className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Date</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
        </label>

        <div>
          <button onClick={() => setLinkOpen((o) => !o)} className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground">
            {linkOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Link to existing record
          </button>
          {linkOpen && (
            <div className="mt-2 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Related quote</span>
                <select value={relatedQuoteId} onChange={(e) => setRelatedQuoteId(e.target.value)} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
                  <option value="">— None —</option>
                  {quotes.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted-foreground">Related order</span>
                <select value={relatedOrderId} onChange={(e) => setRelatedOrderId(e.target.value)} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
                  <option value="">— None —</option>
                  {orders.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </label>
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{k}</span><span className="text-foreground">{v}</span></div>;
}
