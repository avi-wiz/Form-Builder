import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { useStore } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/$formId/analytics")({
  head: () => ({ meta: [{ title: "Form Analytics" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { formId } = Route.useParams();
  const store = useStore();
  const form = store.getForm(formId);
  const [range, setRange] = useState("30");
  if (!form) return <AppShell breadcrumb={[{ label: "Forms", to: "/forms" }]}><div className="p-8">Not found.</div></AppShell>;

  const days = parseInt(range, 10);
  const series = useMemo(() => Array.from({ length: days }).map((_, i) => ({
    date: `D-${days - i}`,
    submissions: Math.max(0, Math.round((Math.sin(i / 3) + 1.2) * 4 + (i % 5))),
  })), [days]);

  const funnel = [
    { step: "Step 1", pct: 100 }, { step: "Step 2", pct: 78 }, { step: "Step 3", pct: 61 }, { step: "Submitted", pct: 52 },
  ];
  const sources = [
    { name: "Direct Link", pct: 45 }, { name: "WizShop Contact", pct: 32 }, { name: "External Embed", pct: 18 }, { name: "QR Code", pct: 5 },
  ];

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }, { label: "Analytics" }]}>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{form.name} — Analytics</h1>
          <select value={range} onChange={(e) => setRange(e.target.value)} className="rounded-md border border-border bg-card px-3 py-1.5 text-sm">
            <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option>
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            { l: "Total Views", v: form.viewCount.toLocaleString() },
            { l: "Total Submissions", v: form.submissionCount.toLocaleString() },
            { l: "Conversion Rate", v: form.viewCount ? ((form.submissionCount / form.viewCount) * 100).toFixed(1) + "%" : "0%" },
            { l: "Avg. Completion Time", v: "2m 14s" },
          ].map((s, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-5">
              <div className="text-xs text-muted-foreground">{s.l}</div>
              <div className="mt-1 text-2xl font-semibold">{s.v}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-3 text-sm font-semibold">Submissions Over Time</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="submissions" stroke="var(--primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 text-sm font-semibold">Funnel (Multi-step)</div>
            <div className="space-y-2">
              {funnel.map((f, i) => (
                <div key={f.step}>
                  <div className="mb-1 flex items-center justify-between text-xs"><span>{f.step}</span><span className="text-muted-foreground">{f.pct}%</span></div>
                  <div className="h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{ width: `${f.pct}%` }} /></div>
                  {i < funnel.length - 1 && <div className="mt-1 text-right text-[10px] text-muted-foreground">↓ {funnel[i].pct - funnel[i + 1].pct}% drop</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 text-sm font-semibold">Top Sources</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={sources}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="pct" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
