import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type DragEvent } from "react";
import {
  Zap, GitBranch, Bell, CheckSquare, UserCheck, ArrowLeft,
  Building2, User, FileText, ShoppingCart, CreditCard,
  AlertTriangle, Ticket, Clock, Megaphone, ToggleRight, ArrowRightCircle,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui-kit";
import { useStore, type WorkflowNode } from "@/lib/forms-store";
import { CRM_PROPERTIES } from "@/lib/crm-catalog";
import { z } from "zod";

export const Route = createFileRoute("/settings/workflow-manager/$workflowId")({
  head: () => ({ meta: [{ title: "Workflow Manager" }] }),
  validateSearch: z.object({ fromFormId: z.string().optional() }),
  component: WorkflowPage,
});

type NodeType = "entry" | "condition" | "action";
type PaletteItem = { kind: string; label: string; type: NodeType; Icon: LucideIcon };
type PaletteSection = { title: string; items: PaletteItem[] };

const PALETTE_SECTIONS: PaletteSection[] = [
  {
    title: "Entity Creation",
    items: [
      { kind: "create_retailer_account", label: "Create Retailer Account", type: "action", Icon: Building2 },
      { kind: "create_contact", label: "Create Contact", type: "action", Icon: User },
      { kind: "create_quote", label: "Create Quote", type: "action", Icon: FileText },
      { kind: "create_order", label: "Create Order", type: "action", Icon: ShoppingCart },
      { kind: "create_credit_application", label: "Create Credit Application", type: "action", Icon: CreditCard },
      { kind: "create_claim", label: "Create Claim / RMA", type: "action", Icon: AlertTriangle },
      { kind: "create_ticket", label: "Create Ticket", type: "action", Icon: Ticket },
      { kind: "log_touchpoint", label: "Log Touchpoint", type: "action", Icon: Clock },
      { kind: "log_campaign_response", label: "Log Campaign Response", type: "action", Icon: Megaphone },
    ],
  },
  {
    title: "Routing / Assignment",
    items: [
      { kind: "assign_rep", label: "Assign Sales Rep", type: "action", Icon: UserCheck },
      { kind: "send_notification", label: "Send Notification", type: "action", Icon: Bell },
      { kind: "create_task", label: "Create Task", type: "action", Icon: CheckSquare },
      { kind: "condition", label: "Branch on Condition", type: "condition", Icon: GitBranch },
    ],
  },
  {
    title: "Status Changes",
    items: [
      { kind: "set_retailer_status", label: "Set Retailer Status", type: "action", Icon: ToggleRight },
      { kind: "set_quote_status", label: "Set Quote Status", type: "action", Icon: ToggleRight },
      { kind: "set_order_status", label: "Set Order Status", type: "action", Icon: ToggleRight },
      { kind: "convert_quote_order", label: "Convert Quote → Order", type: "action", Icon: ArrowRightCircle },
    ],
  },
];

// Entry Point lives implicitly on every workflow; expose it as a draggable too.
const ENTRY_ITEM: PaletteItem = { kind: "entry", label: "Entry Point", type: "entry", Icon: Zap };

const ALL_ITEMS: PaletteItem[] = [ENTRY_ITEM, ...PALETTE_SECTIONS.flatMap((s) => s.items)];
const ICON_BY_KIND: Record<string, LucideIcon> = Object.fromEntries(ALL_ITEMS.map((i) => [i.kind, i.Icon]));

// Status option values, pulled from the catalog so they stay in sync.
const optionValues = (id: string): string[] =>
  CRM_PROPERTIES.find((p) => p.id === id)?.options?.map((o) => o.value) ?? [];
const RETAILER_STATUSES = optionValues("retailer.opening_order_status");
const QUOTE_STATUSES = optionValues("quote.status");
const ORDER_STATUSES = optionValues("order.status");

const STATUS_OPTIONS: Record<string, string[]> = {
  set_retailer_status: RETAILER_STATUSES,
  set_quote_status: QUOTE_STATUSES,
  set_order_status: ORDER_STATUSES,
};

// Resolve a node's icon + one-line summary from its config.kind.
function nodeKind(n: WorkflowNode): string {
  return (n.config as { kind?: string })?.kind ?? (n.type === "entry" ? "entry" : n.type === "condition" ? "condition" : "");
}

function nodeIcon(n: WorkflowNode): LucideIcon {
  return ICON_BY_KIND[nodeKind(n)] ?? (n.type === "entry" ? Zap : n.type === "condition" ? GitBranch : Bell);
}

function nodeSummary(n: WorkflowNode, formName?: string): string {
  const c = (n.config ?? {}) as Record<string, unknown>;
  const kind = nodeKind(n);
  if (kind === "entry") return formName ? `Form: ${formName}` : "Trigger";
  if (kind === "condition") {
    const op = String(c.operator ?? "equals").replace(/_/g, " ");
    return `${c.field ?? "field"} ${op} ${c.value ?? ""}`.trim();
  }
  if (kind === "assign_rep") return `Mode: ${c.assignMode ?? "round-robin"}${c.rep ? ` (${c.rep})` : ""}`;
  if (kind === "send_notification") return c.target ? `To: ${c.target}` : "Notify";
  if (kind === "create_task") return c.title ? String(c.title) : "New task";
  if (kind in STATUS_OPTIONS) return c.status ? `→ ${c.status}` : "Set status";
  if (kind === "convert_quote_order") return "Quote → Order";
  if (kind.startsWith("create_")) {
    const defaults = c.defaults as Record<string, string> | undefined;
    const pairs = defaults ? Object.entries(defaults).map(([k, v]) => `${k.split(".").pop()}=${v}`) : [];
    return pairs.length ? pairs.join(", ") : "Create record";
  }
  return n.label;
}

function WorkflowPage() {
  const { workflowId } = Route.useParams();
  const { fromFormId } = Route.useSearch();
  const navigate = useNavigate();
  const store = useStore();
  const wf = store.workflows.find((w) => w.id === workflowId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!wf || !fromFormId) return;
    const entryNode = wf.nodes.find((n) => n.type === "entry");
    if (!entryNode) return;
    store.updateWorkflow(wf.id, {
      nodes: wf.nodes.map((n) =>
        n.id === entryNode.id
          ? { ...n, config: { ...n.config, kind: "entry", entity: "Forms", formId: fromFormId } }
          : n
      ),
    });
    setSelectedId(entryNode.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wf?.id, fromFormId]);

  if (!wf) return <AppShell breadcrumb={[{ label: "Settings" }]}><div className="p-8">Not found.</div></AppShell>;

  const selected = wf.nodes.find((n) => n.id === selectedId) ?? null;
  const nodeMap = new Map(wf.nodes.map((n) => [n.id, n]));
  const W = 1500, H = 520;

  const onDragStart = (e: DragEvent<HTMLLIElement>, item: PaletteItem) => {
    e.dataTransfer.setData("text/wc-node", JSON.stringify(item));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/wc-node");
    if (!data) return;
    const item: PaletteItem = JSON.parse(data);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(8, Math.min(W - 168, e.clientX - rect.left - 80));
    const y = Math.max(8, Math.min(H - 68, e.clientY - rect.top - 30));
    const newNode: WorkflowNode = {
      id: "n_" + Math.random().toString(36).slice(2, 8),
      type: item.type,
      label: item.label,
      x, y,
      config: item.type === "entry"
        ? { kind: "entry", entity: "Forms", formId: store.forms[0]?.id }
        : { kind: item.kind },
    };
    store.updateWorkflow(wf.id, { nodes: [...wf.nodes, newNode] });
    setSelectedId(newNode.id);
  };

  const entryConfig = selected && selected.type === "entry" ? (selected.config ?? {}) : {};
  const entity = (entryConfig as { entity?: string }).entity ?? "Forms";
  const formId = (entryConfig as { formId?: string }).formId ?? "";

  const updateSelectedConfig = (patch: Record<string, unknown>) => {
    if (!selected) return;
    const nodes = wf.nodes.map((n) => n.id === selected.id ? { ...n, config: { ...(n.config ?? {}), ...patch } } : n);
    store.updateWorkflow(wf.id, { nodes });
  };

  const sourceForm = fromFormId ? store.forms.find((f) => f.id === fromFormId) : null;
  const breadcrumb = sourceForm
    ? [{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: sourceForm.name, to: `/forms/builder/${sourceForm.id}` }, { label: "Workflow Manager" }]
    : [{ label: "Dashboard", to: "/forms" }, { label: "Settings" }, { label: "Workflow Manager" }, { label: wf.name }];

  return (
    <AppShell breadcrumb={breadcrumb}>
      <div className="flex h-full">
        <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-4">
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Drag nodes onto canvas</div>
          <ul className="mb-4 space-y-1">
            <li draggable onDragStart={(e) => onDragStart(e, ENTRY_ITEM)}
                className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing">
              <ENTRY_ITEM.Icon className="h-3.5 w-3.5 text-primary" /> {ENTRY_ITEM.label}
            </li>
          </ul>
          {PALETTE_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{section.title}</div>
              <ul className="space-y-1">
                {section.items.map((p) => {
                  const Icon = p.Icon;
                  return (
                    <li key={p.kind} draggable onDragStart={(e) => onDragStart(e, p)}
                        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs hover:border-primary hover:bg-primary/5 cursor-grab active:cursor-grabbing">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" /> <span className="truncate">{p.label}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1 overflow-auto bg-muted/20 p-6">
          <div className="mb-4 flex items-center gap-3">
            {sourceForm && (
              <button
                onClick={() => navigate({ to: "/forms/builder/$formId", params: { formId: sourceForm.id } })}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to {sourceForm.name}
              </button>
            )}
            <h1 className="text-xl font-semibold">{wf.name}</h1>
            <Badge tone="primary">Active</Badge>
          </div>
          <div
            className="relative rounded-xl border border-border bg-card"
            style={{ width: W, height: H }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
            onDrop={onDrop}
          >
            <svg width={W} height={H} className="absolute inset-0 pointer-events-none">
              {wf.edges.map((e, i) => {
                const a = nodeMap.get(e.from); const b = nodeMap.get(e.to);
                if (!a || !b) return null;
                const x1 = a.x + 160, y1 = a.y + 30, x2 = b.x, y2 = b.y + 30;
                const mx = (x1 + x2) / 2;
                return (
                  <g key={i}>
                    <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} stroke="var(--border)" strokeWidth={2} fill="none" />
                    {e.branch && <text x={mx} y={(y1 + y2) / 2 - 6} textAnchor="middle" fontSize="10" fill={e.branch === "true" ? "var(--primary)" : "var(--muted-foreground)"}>{e.branch.toUpperCase()}</text>}
                  </g>
                );
              })}
            </svg>
            {wf.nodes.map((n) => {
              const Icon = nodeIcon(n);
              const entryFormName = nodeKind(n) === "entry"
                ? store.forms.find((f) => f.id === (n.config as { formId?: string })?.formId)?.name
                : undefined;
              return (
                <button key={n.id} onClick={() => setSelectedId(n.id)}
                  className={`absolute rounded-lg border-2 bg-card px-3 py-2 text-left text-xs shadow-sm transition-all hover:border-primary ${selectedId === n.id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  style={{ left: n.x, top: n.y, width: 160 }}>
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate">{n.label}</span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{nodeSummary(n, entryFormName)}</div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Tip: drag any palette item onto the canvas to add it.</p>
        </div>
        {selected && (
          <aside className="w-80 shrink-0 border-l border-border bg-card p-5 animate-fade-in">
            <div className="text-sm font-semibold">{selected.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">Type: {selected.type}</div>
            {selected.type === "entry" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Entity</span>
                  <select
                    value={entity}
                    onChange={(e) => updateSelectedConfig({ entity: e.target.value, formId: e.target.value === "Forms" ? store.forms[0]?.id : undefined })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option>Orders</option>
                    <option>Products</option>
                    <option>Cart</option>
                    <option>Forms</option>
                  </select>
                </label>
                {entity === "Forms" && (
                  <label className="block animate-fade-in">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Form</span>
                    <select
                      value={formId}
                      onChange={(e) => updateSelectedConfig({ formId: e.target.value })}
                      className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                    >
                      {store.forms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
            )}
            {selected.type === "action" && nodeKind(selected) in STATUS_OPTIONS && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Set status to</span>
                  <select
                    value={(selected.config as Record<string, string>)?.status ?? ""}
                    onChange={(e) => updateSelectedConfig({ status: e.target.value })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">— Select status —</option>
                    {STATUS_OPTIONS[nodeKind(selected)].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            )}
            {selected.type === "action" && nodeKind(selected) === "assign_rep" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Assignment Mode</span>
                  <select
                    value={(selected.config as Record<string, string>)?.assignMode ?? "round-robin"}
                    onChange={(e) => updateSelectedConfig({ assignMode: e.target.value })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="round-robin">Round-Robin</option>
                    <option value="territory">Territory-Based</option>
                    <option value="fixed">Fixed Rep</option>
                  </select>
                </label>
                {((selected.config as Record<string, string>)?.assignMode ?? "round-robin") === "fixed" && (
                  <label className="block animate-fade-in">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Assign To</span>
                    <select className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none">
                      <option>Sarah Chen</option>
                      <option>Marcus Williams</option>
                      <option>Emily Rodriguez</option>
                    </select>
                  </label>
                )}
                {((selected.config as Record<string, string>)?.assignMode ?? "round-robin") === "territory" && (
                  <label className="block animate-fade-in">
                    <span className="mb-1 block text-xs font-medium text-muted-foreground">Territory Mapping</span>
                    <select className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none">
                      <option>Southeast Region</option>
                      <option>Northeast Region</option>
                      <option>West Coast</option>
                    </select>
                  </label>
                )}
              </div>
            )}
            {selected.type === "action" && nodeKind(selected) !== "assign_rep" && !(nodeKind(selected) in STATUS_OPTIONS) && (
              <div className="mt-4 text-xs text-muted-foreground">
                Configure "{selected.label}" when this node fires. (Mock configuration only.)
              </div>
            )}
            {selected.type === "condition" && (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Field</span>
                  <input
                    value={(selected.config as Record<string, string>)?.field ?? ""}
                    onChange={(e) => updateSelectedConfig({ field: e.target.value })}
                    placeholder="e.g. retailer.ein, quote.grand_total"
                    className="w-full rounded-md border border-border px-2 py-1.5 font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Operator</span>
                  <select
                    value={(selected.config as Record<string, string>)?.operator ?? "equals"}
                    onChange={(e) => updateSelectedConfig({ operator: e.target.value })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not equals</option>
                    <option value="contains">contains</option>
                    <option value="greater_than">greater than</option>
                    <option value="is_empty">is empty</option>
                    <option value="not_empty">is not empty</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted-foreground">Value</span>
                  <input
                    value={(selected.config as Record<string, string>)?.value ?? ""}
                    onChange={(e) => updateSelectedConfig({ value: e.target.value })}
                    className="w-full rounded-md border border-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
                    placeholder="Enter value…"
                  />
                </label>
                <div className="mt-2 flex gap-2">
                  <div className="flex-1 rounded-md border border-primary/40 bg-primary/5 px-2 py-1.5 text-center text-xs font-medium text-primary">TRUE →</div>
                  <div className="flex-1 rounded-md border border-border bg-muted/30 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">FALSE →</div>
                </div>
              </div>
            )}
            <button onClick={() => setSelectedId(null)} className="mt-4 text-xs text-primary hover:underline">Close</button>
          </aside>
        )}
      </div>
    </AppShell>
  );
}
