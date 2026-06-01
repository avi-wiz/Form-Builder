import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Trash2 } from "lucide-react";
import { Toggle, DragHandle } from "@/components/ui-kit";
import { useStore, getSectionFields, type Form, type FormSection } from "@/lib/forms-store";
import { Row } from "./Row";
import type { Selection, DragData, DropData } from "./types";

export function SectionBlock({ form, section, selected, setSelected }: { form: Form; section: FormSection; selected: Selection; setSelected: (s: Selection) => void }) {
  const store = useStore();
  const isSelected = selected.kind === "section" && selected.sectionId === section.id;
  const sectionDrag: DragData = { source: "section", sectionId: section.id };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: "section-" + section.id, data: sectionDrag });

  const includedFields = getSectionFields(section).filter((f) => f.included);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`rounded-xl border bg-card ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
      onClick={(e) => { e.stopPropagation(); setSelected({ kind: "section", sectionId: section.id }); }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <DragHandle />
        </span>
        <input
          value={section.name}
          onChange={(e) => store.updateSection(form.id, section.id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 border-none bg-transparent text-base font-semibold focus:outline-none"
        />
        {section.quickAdd && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
            Quick Add ({includedFields.length})
          </span>
        )}
        <span className="text-xs text-muted-foreground">Quick Add</span>
        <Toggle checked={section.quickAdd} onChange={(v) => store.updateSection(form.id, section.id, { quickAdd: v })} />
        <span className="text-xs text-muted-foreground">Show</span>
        <Toggle checked={section.show} onChange={(v) => store.updateSection(form.id, section.id, { show: v })} />
        <button
          onClick={(e) => { e.stopPropagation(); store.removeSection(form.id, section.id); }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          aria-label="Delete section"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Rows */}
      <SectionBody form={form} section={section} selected={selected} setSelected={setSelected} />

      <div className="border-t border-border px-5 py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const newRow = { id: Math.random().toString(36).slice(2, 10), kind: "fields" as const, fields: [] };
            store.addRow(form.id, section.id, newRow);
          }}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="h-4 w-4" /> Add empty row
        </button>
      </div>
    </div>
  );
}

function SectionBody({ form, section, selected, setSelected }: { form: Form; section: FormSection; selected: Selection; setSelected: (s: Selection) => void }) {
  return (
    <div className="p-5 space-y-2">
      {section.rows.length === 0 ? (
        <EmptySectionDrop sectionId={section.id} />
      ) : (
        <>
          <BetweenRowsDrop sectionId={section.id} index={0} />
          {section.rows.map((row, idx) => (
            <div key={row.id}>
              <Row form={form} section={section} row={row} selected={selected} setSelected={setSelected} />
              <BetweenRowsDrop sectionId={section.id} index={idx + 1} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function EmptySectionDrop({ sectionId }: { sectionId: string }) {
  const data: DropData = { kind: "section-area", sectionId };
  const { setNodeRef, isOver } = useDroppable({ id: "empty-" + sectionId, data });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed p-8 text-center text-xs text-muted-foreground ${isOver ? "border-primary bg-primary/5" : "border-border"}`}
    >
      Drop fields here
    </div>
  );
}

function BetweenRowsDrop({ sectionId, index }: { sectionId: string; index: number }) {
  const data: DropData = { kind: "between-rows", sectionId, index };
  const { setNodeRef, isOver } = useDroppable({ id: `btw-${sectionId}-${index}`, data });
  return (
    <div
      ref={setNodeRef}
      className={`h-2 rounded transition-colors ${isOver ? "bg-primary h-3" : ""}`}
    />
  );
}
