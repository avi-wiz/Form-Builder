import { useDraggable } from "@dnd-kit/core";
import { EyeOff, Copy, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui-kit";
import { FIELD_TYPE_META, useStore, type Form, type FormField, type FormRow, type FormSection, type FieldWidth } from "@/lib/forms-store";
import { getEntityLabel } from "@/lib/crm-catalog";
import type { Selection, DragData } from "./types";

export function FieldCard({ form, section, row, field, selected, setSelected }: { form: Form; section: FormSection; row: FormRow; field: FormField; selected: Selection; setSelected: (s: Selection) => void }) {
  const store = useStore();
  const isSelected = selected.kind === "field" && selected.fieldId === field.id;
  const drag: DragData = { source: "field", fieldId: field.id, rowId: row.id, sectionId: section.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "fld-" + field.id, data: drag });

  const widthClass =
    field.width === "third" ? "basis-1/3" :
    field.width === "half"  ? "basis-1/2" :
    "basis-full";

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); setSelected({ kind: "field", sectionId: section.id, rowId: row.id, fieldId: field.id }); }}
      className={`group relative cursor-grab rounded-md border bg-white p-3 text-left transition-all active:cursor-grabbing ${isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"} ${field.type === "hidden" ? "border-dashed bg-muted/30" : ""} ${isDragging ? "opacity-30" : ""} ${widthClass} min-w-0 flex-1`}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {field.type === "hidden" && <EyeOff className="h-3 w-3 text-muted-foreground" />}
        <span className="text-xs font-medium text-foreground">
          {field.displayName}{field.required && <span className="text-destructive"> *</span>}
        </span>
        <Badge tone="outline">{FIELD_TYPE_META[field.type].label}</Badge>
        {field.conditions && field.conditions.rules.length > 0 && (
          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-purple-700">Conditions</span>
        )}
        {field.requiredWhen && field.requiredWhen.rules.length > 0 && (
          <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-purple-700">Req Logic</span>
        )}
        {field.type === "lookup" && (
          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
            🔗 Lookup → {field.lookupEntity ? getEntityLabel(field.lookupEntity) : "—"}
          </span>
        )}
      </div>
      <div className="mt-1.5">
        <FauxInput field={field} />
        {field.allowOther && (field.type === "select" || field.type === "multi_select" || field.type === "radio") && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <input type="radio" disabled className="h-3 w-3" />
            <span>Other:</span>
            <span className="flex-1 rounded border border-dashed border-border px-2 py-0.5">___</span>
          </div>
        )}
      </div>

      {/* Hover toolbar */}
      <div className="absolute -top-3 right-2 hidden items-center gap-0.5 rounded-md border border-border bg-card shadow-sm group-hover:flex" onClick={(e) => e.stopPropagation()}>
        <WidthSegment current={field.width ?? "full"} onChange={(w) => store.updateField(form.id, section.id, field.id, { width: w })} />
        <button
          onClick={(e) => { e.stopPropagation(); store.duplicateField(form.id, section.id, row.id, field.id); }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); store.removeField(form.id, section.id, field.id); if (isSelected) setSelected({ kind: "none" }); }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
          aria-label="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export function WidthSegment({ current, onChange }: { current: FieldWidth; onChange: (w: FieldWidth) => void }) {
  const opts: { v: FieldWidth; label: string }[] = [
    { v: "full", label: "100" },
    { v: "half", label: "50" },
    { v: "third", label: "33" },
  ];
  return (
    <div className="flex items-center rounded border border-border bg-card text-[10px]">
      {opts.map((o) => (
        <button
          key={o.v}
          onClick={(e) => { e.stopPropagation(); onChange(o.v); }}
          className={`px-1.5 py-0.5 ${current === o.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FauxInput({ field }: { field: FormField }) {
  switch (field.type) {
    case "long_text":
    case "html":
      return <div className="h-12 rounded border border-border bg-muted/30 text-xs text-muted-foreground p-2">{field.placeholder ?? "Text area"}</div>;
    case "select":
    case "multi_select":
      return <div className="h-7 rounded border border-border bg-muted/30 text-xs text-muted-foreground px-2 py-1">▾ Select...</div>;
    case "lookup":
      return <div className="flex h-7 items-center gap-1 rounded border border-border bg-muted/30 px-2 py-1 text-xs text-muted-foreground"><Search className="h-3 w-3" /> Search {field.lookupEntity ? "…" : "to look up"}…</div>;
    case "radio":
      return (
        <div className="space-y-0.5">
          {(field.options ?? []).slice(0, 3).map((o) => (
            <div key={o.value} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <input type="radio" disabled className="h-3 w-3" />{o.label}
            </div>
          ))}
        </div>
      );
    case "checkbox":
      return <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><input type="checkbox" disabled className="h-3 w-3" /> Yes</div>;
    case "consent":
      return (
        <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <input type="checkbox" disabled className="mt-0.5 h-3 w-3" />
          <span className="line-clamp-2">{field.consentText ?? "Consent text"}</span>
        </div>
      );
    case "rating":
      return <div className="text-[11px] text-muted-foreground">★ ★ ★ ★ ★</div>;
    case "hidden":
      return <div className="text-[11px] italic text-muted-foreground">Hidden field — not shown to users</div>;
    default:
      return <div className="h-7 rounded border border-border bg-muted/30 text-xs text-muted-foreground px-2 py-1">{field.placeholder ?? ""}</div>;
  }
}
