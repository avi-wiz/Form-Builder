import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Share2, Undo2, Redo2, MoreHorizontal, Copy, Inbox, Trash2, Download } from "lucide-react";
import { Btn, Badge, Toast } from "@/components/ui-kit";
import { useStore, type Form } from "@/lib/forms-store";

export function TopBar({ form }: { form: Form }) {
  const store = useStore();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClone = () => {
    const copy = store.cloneForm(form.id);
    setMenuOpen(false);
    setToast("Form cloned");
    if (copy) setTimeout(() => navigate({ to: "/forms/builder/$formId", params: { formId: copy.id } }), 800);
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${form.name}"? This cannot be undone.`)) return;
    store.deleteForm(form.id);
    setMenuOpen(false);
    navigate({ to: "/forms" });
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(form, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate({ to: "/forms" })} className="rounded p-1 hover:bg-muted" aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <input
          value={form.name}
          onChange={(e) => store.updateForm(form.id, { name: e.target.value })}
          className="border-none bg-transparent text-lg font-semibold focus:outline-none"
        />
        <Badge tone={form.status === "published" ? "primary" : "outline"}>{form.status}</Badge>
      </div>
      <div className="flex items-center gap-2">
        <button title="Undo (not yet wired)" className="rounded p-2 text-muted-foreground hover:bg-muted disabled:opacity-40" disabled>
          <Undo2 className="h-4 w-4" />
        </button>
        <button title="Redo (not yet wired)" className="rounded p-2 text-muted-foreground hover:bg-muted disabled:opacity-40" disabled>
          <Redo2 className="h-4 w-4" />
        </button>
        <Btn variant="outline" onClick={() => navigate({ to: "/forms/$formId/share", params: { formId: form.id } })}>
          <Share2 className="h-4 w-4" /> Share
        </Btn>
        <Btn variant="outline" onClick={() => navigate({ to: "/forms/preview/$formId", params: { formId: form.id } })}>
          <Eye className="h-4 w-4" /> Preview
        </Btn>
        <Btn onClick={() => {
          store.updateForm(form.id, { status: form.status === "published" ? "draft" : "published" });
          setToast(form.status === "published" ? "Form unpublished" : "Form published");
        }}>
          {form.status === "published" ? "Unpublish" : "Publish"}
        </Btn>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-2 text-muted-foreground hover:bg-muted"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-border bg-card shadow-md">
                <button onClick={handleClone} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted">
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" /> Clone form
                </button>
                <button onClick={handleExport} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" /> Export JSON
                </button>
                <button
                  onClick={() => { setMenuOpen(false); navigate({ to: "/forms/$formId/submissions", params: { formId: form.id } }); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted"
                >
                  <Inbox className="h-3.5 w-3.5 text-muted-foreground" /> View submissions
                </button>
                <div className="my-1 border-t border-border" />
                <button onClick={handleDelete} className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-destructive/5">
                  <Trash2 className="h-3.5 w-3.5" /> Delete form
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Toast open={!!toast} onClose={() => setToast("")} message={toast} />
    </div>
  );
}
