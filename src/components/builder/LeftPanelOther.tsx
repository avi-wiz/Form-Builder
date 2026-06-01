import { useDraggable } from "@dnd-kit/core";
import { Type, Image as ImageIcon, Minus, Heading as HeadingIcon, ShieldCheck, FormInput } from "lucide-react";
import { FIELD_TYPE_META, type FieldType } from "@/lib/forms-store";
import type { DragData, LibraryDragKind } from "./types";

export function LeftPanelOther() {
  return (
    <div className="p-3 space-y-4">
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Layout Elements</div>
        <div className="grid grid-cols-2 gap-2">
          <ElementCard kind="richText" label="Rich Text" icon={<Type className="h-4 w-4" />} />
          <ElementCard kind="heading" label="Heading" icon={<HeadingIcon className="h-4 w-4" />} />
          <ElementCard kind="divider" label="Divider" icon={<Minus className="h-4 w-4" />} />
          <ElementCard kind="image" label="Image" icon={<ImageIcon className="h-4 w-4" />} />
        </div>
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pre-built Blocks</div>
        <ElementCard kind="consent" label="Consent Block" icon={<ShieldCheck className="h-4 w-4" />} fullWidth />
      </div>
      <div>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Unmapped Field Types</div>
        <p className="mb-2 text-[11px] text-muted-foreground">Add a raw field type not tied to a CRM property.</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(FIELD_TYPE_META) as FieldType[]).map((t) => (
            <FieldTypeCard key={t} type={t} label={FIELD_TYPE_META[t].label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ElementCard({ kind, label, icon, fullWidth }: { kind: LibraryDragKind; label: string; icon: React.ReactNode; fullWidth?: boolean }) {
  const data: DragData = { source: "libraryElement", elementKind: kind };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "lib-el-" + kind, data });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 rounded-md border border-border bg-white px-2.5 py-2 text-xs font-medium hover:border-primary/40 hover:bg-primary/5 ${fullWidth ? "col-span-2" : ""} ${isDragging ? "opacity-30" : ""}`}
    >
      <span className="text-primary">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FieldTypeCard({ type, label }: { type: FieldType; label: string }) {
  const data: DragData = { source: "libraryField", fieldType: type, displayName: label };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: "lib-ft-" + type, data });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-1.5 rounded border border-border bg-white px-1.5 py-1.5 text-[11px] hover:border-primary/40 hover:bg-primary/5 ${isDragging ? "opacity-30" : ""}`}
    >
      <FormInput className="h-3 w-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
    </button>
  );
}
