import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";
import { DragHandle } from "@/components/ui-kit";
import { useStore, type Form, type FormSection, type FormRow } from "@/lib/forms-store";
import { FieldCard } from "./FieldCard";
import type { Selection, DragData, DropData } from "./types";

export function Row({ form, section, row, selected, setSelected }: { form: Form; section: FormSection; row: FormRow; selected: Selection; setSelected: (s: Selection) => void }) {
  const store = useStore();
  const drag: DragData = { source: "row", rowId: row.id, sectionId: section.id };
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: "row-" + row.id, data: drag });
  const dropData: DropData = { kind: "row", sectionId: section.id, rowId: row.id };
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: "row-drop-" + row.id, data: dropData });

  const isSelected = selected.kind === "row" && selected.rowId === row.id;

  const setRefs = (el: HTMLElement | null) => { setNodeRef(el); dropRef(el); };

  return (
    <div
      ref={setRefs}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={`group relative rounded-md border ${isSelected ? "border-primary ring-2 ring-primary/20" : isOver ? "border-primary/50" : "border-transparent hover:border-border"} bg-white`}
      onClick={(e) => {
        e.stopPropagation();
        if (row.kind !== "fields") setSelected({ kind: "row", sectionId: section.id, rowId: row.id });
      }}
    >
      <span {...attributes} {...listeners} className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab opacity-0 group-hover:opacity-100 active:cursor-grabbing" aria-label="Drag row">
        <DragHandle />
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); store.removeRow(form.id, section.id, row.id); }}
        className="absolute right-1 top-1 rounded p-1 text-muted-foreground opacity-0 hover:bg-muted hover:text-destructive group-hover:opacity-100"
        aria-label="Delete row"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="pl-6 pr-6 py-2">
        {row.kind === "fields" && <FieldsRowBody form={form} section={section} row={row} selected={selected} setSelected={setSelected} />}
        {row.kind === "richText" && (
          <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: row.richText?.html ?? "" }} />
        )}
        {row.kind === "divider" && <hr className="my-3 border-border" />}
        {row.kind === "heading" && (
          row.heading?.level === 3
            ? <h3 className="text-base font-semibold">{row.heading?.text}</h3>
            : <h2 className="text-lg font-semibold">{row.heading?.text ?? ""}</h2>
        )}
        {row.kind === "image" && row.image && (
          <div className={`flex ${row.image.align === "left" ? "justify-start" : row.image.align === "right" ? "justify-end" : "justify-center"}`}>
            <img src={row.image.src} alt={row.image.alt ?? ""} className="max-w-full rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

function FieldsRowBody({ form, section, row, selected, setSelected }: { form: Form; section: FormSection; row: FormRow; selected: Selection; setSelected: (s: Selection) => void }) {
  const fields = row.fields ?? [];
  if (fields.length === 0) {
    const data: DropData = { kind: "row-slot", sectionId: section.id, rowId: row.id, slotIndex: 0 };
    return <EmptyRowSlot id={"slot-" + row.id + "-0"} data={data} />;
  }
  return (
    <div className="flex items-stretch gap-2">
      <RowSlot sectionId={section.id} rowId={row.id} index={0} />
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-stretch gap-2 flex-1">
          <FieldCard form={form} section={section} row={row} field={f} selected={selected} setSelected={setSelected} />
          <RowSlot sectionId={section.id} rowId={row.id} index={i + 1} />
        </div>
      ))}
    </div>
  );
}

function RowSlot({ sectionId, rowId, index }: { sectionId: string; rowId: string; index: number }) {
  const data: DropData = { kind: "row-slot", sectionId, rowId, slotIndex: index };
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${rowId}-${index}`, data });
  return (
    <div
      ref={setNodeRef}
      className={`w-1 self-stretch rounded transition-all ${isOver ? "w-2 bg-primary" : "bg-transparent"}`}
    />
  );
}

function EmptyRowSlot({ id, data }: { id: string; data: DropData }) {
  const { setNodeRef, isOver } = useDroppable({ id, data });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border-2 border-dashed p-4 text-center text-xs text-muted-foreground ${isOver ? "border-primary bg-primary/5" : "border-border"}`}
    >
      Drop a field here
    </div>
  );
}
