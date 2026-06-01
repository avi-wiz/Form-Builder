import { useStore, type Form, type FormRow } from "@/lib/forms-store";

export function RichTextConfigPanel({ form, sectionId, row, onDelete }: { form: Form; sectionId: string; row: FormRow; onDelete: () => void }) {
  const store = useStore();
  const update = (patch: Partial<FormRow>) => store.updateRow(form.id, sectionId, row.id, patch);

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{row.kind}</div>

      {row.kind === "richText" && (
        <label className="block">
          <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">HTML content</span>
          <textarea
            value={row.richText?.html ?? ""}
            onChange={(e) => update({ richText: { html: e.target.value } })}
            rows={8}
            className="w-full rounded-md border border-border px-2.5 py-1.5 text-xs font-mono"
          />
          <p className="mt-1 text-[10px] text-muted-foreground">Tip: paste plain HTML. Use &lt;strong&gt;, &lt;em&gt;, &lt;a href&gt;, &lt;br&gt;.</p>
        </label>
      )}

      {row.kind === "heading" && (
        <>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Text</span>
            <input
              value={row.heading?.text ?? ""}
              onChange={(e) => update({ heading: { text: e.target.value, level: row.heading?.level ?? 2 } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Level</span>
            <select
              value={row.heading?.level ?? 2}
              onChange={(e) => update({ heading: { text: row.heading?.text ?? "", level: Number(e.target.value) as 2 | 3 } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </label>
        </>
      )}

      {row.kind === "image" && (
        <>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Image URL</span>
            <input
              value={row.image?.src ?? ""}
              onChange={(e) => update({ image: { ...row.image!, src: e.target.value } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Alt text</span>
            <input
              value={row.image?.alt ?? ""}
              onChange={(e) => update({ image: { ...row.image!, alt: e.target.value } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            />
          </label>
          <label className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Alignment</span>
            <select
              value={row.image?.align ?? "center"}
              onChange={(e) => update({ image: { ...row.image!, align: e.target.value as "left" | "center" | "right" } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </>
      )}

      {row.kind === "divider" && (
        <p className="text-xs text-muted-foreground">Dividers are visual horizontal lines. No options to configure.</p>
      )}

      <button
        onClick={() => { store.removeRow(form.id, sectionId, row.id); onDelete(); }}
        className="mt-2 w-full rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
      >
        Delete block
      </button>
    </div>
  );
}
