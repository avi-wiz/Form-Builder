import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Sun, Moon, Monitor } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Toggle, Toast } from "@/components/ui-kit";
import { useStore, type EmbedTheme } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/$formId/share")({
  head: () => ({ meta: [{ title: "Share & Embed" }] }),
  component: SharePage,
});

function SharePage() {
  const { formId } = Route.useParams();
  const store = useStore();
  const form = store.getForm(formId);
  const [publicOn, setPublicOn] = useState(true);
  const [embedPage, setEmbedPage] = useState("Contact Us");
  const [raw, setRaw] = useState(false);
  const [toast, setToast] = useState("");
  if (!form) return <AppShell breadcrumb={[{ label: "Forms", to: "/forms" }]}><div className="p-8">Not found.</div></AppShell>;

  const theme: EmbedTheme = form.embedTheme ?? "light";
  const url = `https://acme-wholesale.wizcommerce.com/forms/${form.slug}?theme=${theme}`;
  const embed = raw
    ? `<iframe src="https://acme-wholesale.wizcommerce.com/forms/embed/${form.slug}?theme=${theme}" width="100%" height="600" frameborder="0"></iframe>`
    : `<script src="https://acme-wholesale.wizcommerce.com/forms/embed/${form.slug}.js"></script>\n<div id="wc-form-${form.slug}" data-theme="${theme}"></div>`;

  const copy = (s: string, label: string) => { navigator.clipboard.writeText(s); setToast(label + " copied"); };
  const downloadQr = () => {
    const c = document.querySelector<HTMLCanvasElement>("#form-qr canvas");
    if (!c) return;
    const a = document.createElement("a"); a.href = c.toDataURL(); a.download = `${form.slug}-qr.png`; a.click();
  };

  const setTheme = (t: EmbedTheme) => store.updateForm(form.id, { embedTheme: t });

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }, { label: "Share & Embed" }]}>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <h1 className="text-xl font-semibold">Share & Embed · {form.name}</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="font-semibold">Standalone Page</div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Public Access</span>
              <Toggle checked={publicOn} onChange={setPublicOn} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input readOnly value={url} className="flex-1 rounded-md border border-border bg-muted px-2 py-1.5 text-xs" />
              <button onClick={() => copy(url, "URL")} className="rounded-md p-1.5 hover:bg-muted"><Copy className="h-4 w-4" /></button>
            </div>
            <div id="form-qr" className="mt-4 flex justify-center"><QRCodeCanvas value={url} size={128} /></div>
            <Btn variant="outline" className="mt-3 w-full" onClick={downloadQr}><Download className="h-4 w-4" /> Download QR (PNG)</Btn>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="font-semibold">Embed on WizShop</div>
            <select value={embedPage} onChange={(e) => setEmbedPage(e.target.value)} className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm">
              {["Contact Us", "About", "Custom Page 1"].map((p) => <option key={p}>{p}</option>)}
            </select>
            <Btn className="mt-3 w-full" onClick={() => setToast("Added to " + embedPage)}>Add to Page</Btn>
            <div className="mt-3 text-xs text-muted-foreground">Currently embedded on: <span className="font-medium text-foreground">Contact Us</span> ✅</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Embed on External Site</div>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={raw} onChange={(e) => setRaw(e.target.checked)} /> Raw HTML</label>
            </div>
            <pre className="mt-3 overflow-auto rounded-md bg-foreground p-3 text-xs text-background font-mono">{embed}</pre>
            <Btn variant="outline" className="mt-3 w-full" onClick={() => copy(embed, "Embed code")}><Copy className="h-4 w-4" /> Copy Code</Btn>
          </div>
        </div>

        {/* Theme picker + live preview */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Theme</div>
              <div className="text-xs text-muted-foreground">Controls the look of your embedded and standalone form.</div>
            </div>
            <div className="inline-flex rounded-lg border border-border bg-muted p-1">
              {([
                { v: "light", label: "Light", Icon: Sun },
                { v: "dark", label: "Dark", Icon: Moon },
                { v: "auto", label: "Auto", Icon: Monitor },
              ] as { v: EmbedTheme; label: string; Icon: typeof Sun }[]).map(({ v, label, Icon }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    theme === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-muted-foreground">Live preview</div>
            <ThemePreview theme={theme} formName={form.name} />
          </div>
        </div>
      </div>
      <Toast open={!!toast} onClose={() => setToast("")} message={toast} />
    </AppShell>
  );
}

function ThemePreview({ theme, formName }: { theme: EmbedTheme; formName: string }) {
  // Dark uses inline tokens per spec; Auto shows side-by-side; Light uses default tokens.
  if (theme === "auto") {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <ThemeCard mode="light" formName={formName} caption="Light (system)" />
        <ThemeCard mode="dark" formName={formName} caption="Dark (system)" />
      </div>
    );
  }
  return <ThemeCard mode={theme} formName={formName} />;
}

function ThemeCard({ mode, formName, caption }: { mode: "light" | "dark"; formName: string; caption?: string }) {
  const isDark = mode === "dark";
  const bg = isDark ? "#1F2937" : "#FFFFFF";
  const text = isDark ? "#F9FAFB" : "#111827";
  const sub = isDark ? "#9CA3AF" : "#6B7280";
  const fieldBg = isDark ? "#374151" : "#FFFFFF";
  const border = isDark ? "#4B5563" : "#E5E7EB";
  const primary = "#16A34A";
  return (
    <div className="rounded-xl border border-border p-4" style={{ background: isDark ? "#0F172A" : "#F9FAFB" }}>
      {caption && <div className="mb-2 text-xs font-medium" style={{ color: isDark ? "#CBD5E1" : "#475569" }}>{caption}</div>}
      <div className="rounded-lg p-5 shadow-sm" style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="text-base font-semibold" style={{ color: text }}>{formName}</div>
        <div className="mt-1 text-xs" style={{ color: sub }}>Embedded preview</div>

        <div className="mt-4 space-y-3">
          <div>
            <div className="mb-1 text-xs font-medium" style={{ color: text }}>Company name</div>
            <input readOnly value="Acme Co." className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
              style={{ background: fieldBg, color: text, border: `1px solid ${border}` }} />
          </div>
          <div>
            <div className="mb-1 text-xs font-medium" style={{ color: text }}>Email</div>
            <input readOnly value="name@acme.com" className="w-full rounded-md px-3 py-2 text-sm focus:outline-none"
              style={{ background: fieldBg, color: text, border: `1px solid ${border}` }} />
          </div>
        </div>

        <button className="mt-5 w-full rounded-md px-4 py-2 text-sm font-medium text-white"
          style={{ background: primary }}>
          Submit
        </button>
      </div>
    </div>
  );
}
