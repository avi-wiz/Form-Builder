import { useDroppable, useDndContext } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ArrowDown, Plus } from "lucide-react";
import { useStore, DEFAULT_FORM_STYLE, type Form } from "@/lib/forms-store";
import { SectionBlock } from "./SectionBlock";
import type { Selection, DropData } from "./types";

export function Canvas({ form, selected, setSelected, fontStack }: { form: Form; selected: Selection; setSelected: (s: Selection) => void; fontStack: string }) {
  const store = useStore();
  const style = form.style ?? DEFAULT_FORM_STYLE;
  const onBlankClick = () => setSelected({ kind: "none" });
  return (
    <div className="min-w-0 flex-1 overflow-auto bg-white" onClick={onBlankClick}>
      <div className="mx-auto max-w-4xl space-y-2 p-6" style={{ fontFamily: fontStack }}>
        {form.sections.length === 0 && <EmptyCanvas onAddSection={(e) => { e.stopPropagation(); store.addSection(form.id); }} />}
        <SortableContext items={form.sections.map((s) => "section-" + s.id)} strategy={verticalListSortingStrategy}>
          {form.sections.map((s, idx) => (
            <div key={s.id} className="space-y-2">
              {idx === 0 && form.sections.length > 0 && <FirstSectionTopDrop sectionId={s.id} />}
              {idx > 0 && <BetweenSectionsDrop prevSectionId={form.sections[idx - 1].id} />}
              <SectionBlock form={form} section={s} selected={selected} setSelected={setSelected} />
            </div>
          ))}
        </SortableContext>
        {form.sections.length > 0 && <AfterLastSectionDrop lastSectionId={form.sections[form.sections.length - 1].id} />}
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

function useIsDraggingLibraryOrRow() {
  const { active } = useDndContext();
  const a = active?.data?.current as { source?: string } | undefined;
  if (!a) return false;
  return a.source === "libraryProperty" || a.source === "libraryField" || a.source === "libraryElement" || a.source === "row" || a.source === "field";
}

function FirstSectionTopDrop({ sectionId }: { sectionId: string }) {
  // Drops at the very top of the canvas → insert as the new row 0 of the first section.
  const data: DropData = { kind: "between-rows", sectionId, index: 0 };
  const { setNodeRef, isOver } = useDroppable({ id: `top-${sectionId}`, data });
  const dragging = useIsDraggingLibraryOrRow();
  if (!dragging) return <div className="h-1" />;
  return (
    <div ref={setNodeRef} className="relative flex h-8 items-center justify-center">
      <div className={`h-1 w-full rounded border border-dashed transition-colors ${isOver ? "border-primary bg-primary" : "border-primary/40 bg-primary/10"}`} />
      <span className={`absolute rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${isOver ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
        {isOver ? "Insert at top" : "Drop above"}
      </span>
    </div>
  );
}

function BetweenSectionsDrop({ prevSectionId }: { prevSectionId: string }) {
  // Drops here append to the END of the previous section so the row appears visually
  // between the two sections rather than landing inside the next one.
  const data: DropData = { kind: "section-area", sectionId: prevSectionId };
  const { setNodeRef, isOver } = useDroppable({ id: `between-${prevSectionId}`, data });
  const dragging = useIsDraggingLibraryOrRow();
  if (!dragging) return <div className="h-1" />;
  return (
    <div ref={setNodeRef} className="relative flex h-10 items-center justify-center">
      <div className={`h-1 w-full rounded border border-dashed transition-colors ${isOver ? "border-primary bg-primary" : "border-primary/40 bg-primary/10"}`} />
      <span className={`absolute rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${isOver ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
        {isOver ? "Drop between sections" : "Drop here"}
      </span>
    </div>
  );
}

function AfterLastSectionDrop({ lastSectionId }: { lastSectionId: string }) {
  // Drops below the last section append to it. Same behavior as BetweenSectionsDrop
  // but rendered after the final section in the list.
  const data: DropData = { kind: "section-area", sectionId: lastSectionId };
  const { setNodeRef, isOver } = useDroppable({ id: `after-${lastSectionId}`, data });
  const dragging = useIsDraggingLibraryOrRow();
  if (!dragging) return <div className="h-1" />;
  return (
    <div ref={setNodeRef} className="relative flex h-10 items-center justify-center">
      <div className={`h-1 w-full rounded border border-dashed transition-colors ${isOver ? "border-primary bg-primary" : "border-primary/40 bg-primary/10"}`} />
      <span className={`absolute rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${isOver ? "bg-primary text-primary-foreground" : "bg-primary/20 text-primary"}`}>
        {isOver ? "Drop below last section" : "Drop here"}
      </span>
    </div>
  );
}

function EmptyCanvas({ onAddSection }: { onAddSection: (e: React.MouseEvent) => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-16 text-center text-muted-foreground">
      <ArrowDown className="mx-auto mb-3 h-6 w-6 text-muted-foreground/60" />
      <p className="text-sm font-medium text-foreground">Drag fields from the left panel to start building your form</p>
      <p className="mt-1 text-xs">Or add a section first to group related fields together</p>
      <button onClick={onAddSection} className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
        <Plus className="h-3.5 w-3.5" /> Add Section
      </button>
    </div>
  );
}
