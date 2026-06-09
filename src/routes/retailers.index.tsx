import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui-kit";
import { useStore, type RetailerAccount } from "@/lib/forms-store";

export const Route = createFileRoute("/retailers/")({
  head: () => ({ meta: [{ title: "Retailers · WizCommerce" }] }),
  component: RetailersList,
});

type FilterKey = "all" | "prospects" | "active" | "dormant" | "lost";

const FILTERS: { key: FilterKey; label: string; statuses: RetailerAccount["opening_order_status"][] | null }[] = [
  { key: "all", label: "All", statuses: null },
  { key: "prospects", label: "Prospects", statuses: ["prospect"] },
  { key: "active", label: "Active", statuses: ["opened", "active"] },
  { key: "dormant", label: "Dormant", statuses: ["dormant_90d", "dormant_180d", "reactivated"] },
  { key: "lost", label: "Lost", statuses: ["lost"] },
];

const STATUS_TONE: Record<RetailerAccount["opening_order_status"], "primary" | "info" | "warning" | "destructive" | "neutral"> = {
  prospect: "info",
  opened: "primary",
  active: "primary",
  dormant_90d: "warning",
  dormant_180d: "warning",
  reactivated: "primary",
  lost: "destructive",
};

const STATUS_LABEL: Record<RetailerAccount["opening_order_status"], string> = {
  prospect: "Prospect",
  opened: "Opened",
  active: "Active",
  dormant_90d: "Dormant (90d)",
  dormant_180d: "Dormant (180d)",
  reactivated: "Reactivated",
  lost: "Lost",
};

function matchesFilter(r: RetailerAccount, key: FilterKey): boolean {
  const f = FILTERS.find((x) => x.key === key)!;
  return f.statuses === null || f.statuses.includes(r.opening_order_status);
}

function RetailersList() {
  const store = useStore();
  const navigate = useNavigate();
  // No user-role profile exists in this prototype, so the default landing tab is
  // "All" (managers). Reps would default to "Prospects" once a role hint exists.
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    for (const f of FILTERS) c[f.key] = store.retailers.filter((r) => matchesFilter(r, f.key)).length;
    return c;
  }, [store.retailers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return store.retailers.filter((r) => {
      if (!matchesFilter(r, filter)) return false;
      if (!q) return true;
      return [r.legal_name, r.dba, r.id, r.primary_rep, r.territory_assigned]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [store.retailers, filter, query]);

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Retailers" }]}>
      <div className="mx-auto max-w-7xl space-y-4 p-6">
        <h1 className="text-xl font-semibold text-foreground">Retailers</h1>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded px-3 py-1.5 text-xs font-semibold ${filter === f.key ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
              >
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>
          <div className="relative ml-auto">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search retailers…"
              className="h-9 w-56 rounded-md border border-border bg-card pl-8 pr-3 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 text-left font-medium">Retailer</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3 text-left font-medium">Sales Rep</th>
                <th className="px-5 py-3 text-left font-medium">Territory</th>
                <th className="px-5 py-3 text-right font-medium">Stores</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => navigate({ to: "/retailers/$retailerId", params: { retailerId: r.id } })}
                  className="cursor-pointer border-t border-border hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <div className="font-medium text-foreground">{r.legal_name}</div>
                    <div className="text-xs text-muted-foreground">{r.id}{r.dba ? ` · ${r.dba}` : ""}</div>
                  </td>
                  <td className="px-5 py-3"><Badge tone={STATUS_TONE[r.opening_order_status]}>{STATUS_LABEL[r.opening_order_status]}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground">{r.primary_rep ?? "—"}</td>
                  <td className="px-5 py-3 text-muted-foreground">{r.territory_assigned ?? "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.store_count ?? "—"}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No retailers match this view.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
