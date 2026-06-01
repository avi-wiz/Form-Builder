import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Eye, Share2, Undo2, Redo2, MoreHorizontal } from "lucide-react";
import { Btn, Badge, Toast } from "@/components/ui-kit";
import { useStore, type Form } from "@/lib/forms-store";

export function TopBar({ form }: { form: Form }) {
  const store = useStore();
  const navigate = useNavigate();
  const [toast, setToast] = useState("");

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
        {/* TODO: hook Undo/Redo to a history store; currently visual-only */}
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
        <button className="rounded p-2 text-muted-foreground hover:bg-muted" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      <Toast open={!!toast} onClose={() => setToast("")} message={toast} />
    </div>
  );
}
