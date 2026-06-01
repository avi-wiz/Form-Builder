import { Toggle } from "@/components/ui-kit";
import { useStore, type Form, type FormSection } from "@/lib/forms-store";

export function SectionConfigPanel({ form, section, onDelete }: { form: Form; section: FormSection; onDelete: () => void }) {
  const store = useStore();
  const update = (patch: Partial<FormSection>) => store.updateSection(form.id, section.id, patch);

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Name</span>
        <input value={section.name} onChange={(e) => update({ name: e.target.value })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none" />
      </label>
      <label className="block">
        <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">Description</span>
        <textarea value={section.description ?? ""} onChange={(e) => update({ description: e.target.value })} rows={2} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
      </label>
      <div className="flex items-center justify-between py-1 text-sm">
        <span>Include in Quick Add</span>
        <Toggle checked={section.quickAdd} onChange={(v) => update({ quickAdd: v })} />
      </div>
      <div className="flex items-center justify-between py-1 text-sm">
        <span>Show on form</span>
        <Toggle checked={section.show} onChange={(v) => update({ show: v })} />
      </div>
      <div className="space-y-1.5 pt-3 border-t border-border">
        <button
          onClick={() => {
            if (!confirm("Delete this section AND all its fields?")) return;
            store.removeSection(form.id, section.id);
            onDelete();
          }}
          className="w-full rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
        >
          Delete section and fields
        </button>
      </div>
    </div>
  );
}
