import { useDroppable, useDndContext } from "@dnd-kit/core";
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
        {row.kind === "richText" && <RichTextBlock html={row.richText?.html ?? ""} />}
        {row.kind === "divider" && <DividerBlock />}
        {row.kind === "heading" && <HeadingBlock text={row.heading?.text ?? ""} level={row.heading?.level ?? 2} />}
        {row.kind === "image" && row.image && (
          <div className={`flex ${row.image.align === "left" ? "justify-start" : row.image.align === "right" ? "justify-end" : "justify-center"}`}>
            <img src={row.image.src} alt={row.image.alt ?? ""} className="max-w-full rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

function RichTextBlock({ html }: { html: string }) {
  const isPlaceholder = !html.trim() || html.trim() === "<p>Start typing…</p>" || html.trim() === "<p></p>";
  return (
    <div className="group/block relative">
      <span className="absolute -top-2 left-2 z-10 hidden rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary group-hover/block:inline-flex">
        Rich Text
      </span>
      <div
        className={`prose prose-sm max-w-none rounded-md border border-dashed px-3 py-2 text-sm transition-colors ${
          isPlaceholder ? "border-border text-muted-foreground italic" : "border-transparent group-hover/block:border-border"
        }`}
        dangerouslySetInnerHTML={{ __html: isPlaceholder ? "Click to add text…" : html }}
      />
    </div>
  );
}

function HeadingBlock({ text, level }: { text: string; level: 2 | 3 }) {
  const isPlaceholder = !text.trim();
  const display = isPlaceholder ? "Click to add heading…" : text;
  return (
    <div className="group/block relative">
      <span className="absolute -top-2 left-2 z-10 hidden rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary group-hover/block:inline-flex">
        H{level}
      </span>
      <div className={`rounded-md border border-dashed px-3 py-2 transition-colors ${isPlaceholder ? "border-border" : "border-transparent group-hover/block:border-border"}`}>
        {level === 3 ? (
          <h3 className={`text-base font-semibold ${isPlaceholder ? "text-muted-foreground italic" : ""}`}>{display}</h3>
        ) : (
          <h2 className={`text-lg font-semibold ${isPlaceholder ? "text-muted-foreground italic" : ""}`}>{display}</h2>
        )}
      </div>
    </div>
  );
}

function DividerBlock() {
  return (
    <div className="group/block relative py-2">
      <span className="absolute -top-2 left-2 z-10 hidden rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary group-hover/block:inline-flex">
        Divider
      </span>
      <hr className="border-t-2 border-border" />
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
  const { active } = useDndContext();
  const a = active?.data?.current as { source?: string } | undefined;
  const dragging = !!a && (a.source === "libraryProperty" || a.source === "libraryField" || a.source === "field");
  // While idle: narrow 4px column, no extra hit area (so it doesn't block clicks on
  // adjacent field cards). While a field is being dragged: visible 8px column with a
  // hint indicator so users can clearly target side-by-side placement.
  if (!dragging) return <div className="w-1 shrink-0 self-stretch" />;
  return (
    <div ref={setNodeRef} className="w-2 shrink-0 self-stretch py-2">
      <div className={`h-full w-full rounded border border-dashed transition-colors ${isOver ? "border-primary bg-primary" : "border-primary/40 bg-primary/10"}`} />
    </div>
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
