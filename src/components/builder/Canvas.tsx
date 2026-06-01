import { useDroppable } from "@dnd-kit/core";
import { DEFAULT_FORM_STYLE, type Form } from "@/lib/forms-store";
import { SectionBlock } from "./SectionBlock";
import type { Selection } from "./types";

export function Canvas({ form, selected, setSelected, fontStack }: { form: Form; selected: Selection; setSelected: (s: Selection) => void; fontStack: string }) {
  const style = form.style ?? DEFAULT_FORM_STYLE;
  const onBlankClick = () => setSelected({ kind: "none" });
  return (
    <div className="min-w-0 flex-1 overflow-auto bg-white" onClick={onBlankClick}>
      <div className="mx-auto max-w-4xl space-y-6 p-6" style={{ fontFamily: fontStack }}>
        {form.sections.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-muted-foreground">
            <p className="text-sm">No sections yet. Click + Add Section to start.</p>
          </div>
        )}
        {form.sections.map((s) => (
          <SectionBlock key={s.id} form={form} section={s} selected={selected} setSelected={setSelected} />
        ))}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: style.buttonColor, borderRadius: style.buttonRadius }}
          >
            {style.submitText || "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DropArea({ id, data, className }: { id: string; data: Record<string, unknown>; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return <div ref={setNodeRef} className={`${className ?? ""} ${isOver ? "bg-primary/10 ring-2 ring-primary/40" : ""} transition-colors`} />;
}
