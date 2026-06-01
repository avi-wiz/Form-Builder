import { X } from "lucide-react";
import { getSectionFields, type Form } from "@/lib/forms-store";
import type { Selection } from "./types";
import { FieldConfigPanel } from "./panels/FieldConfigPanel";
import { SectionConfigPanel } from "./panels/SectionConfigPanel";
import { RichTextConfigPanel } from "./panels/RichTextConfigPanel";
import { FormSettingsTabs } from "./panels/FormSettingsTabs";

export function RightPanel({ form, selected, setSelected }: { form: Form; selected: Selection; setSelected: (s: Selection) => void }) {
  return (
    <aside className="hidden w-[320px] shrink-0 flex-col border-l border-border bg-white lg:flex">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="text-sm font-semibold">{getTitle(selected)}</div>
        {selected.kind !== "none" && (
          <button onClick={() => setSelected({ kind: "none" })} className="rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <Body form={form} selected={selected} setSelected={setSelected} />
      </div>
    </aside>
  );
}

function getTitle(s: Selection): string {
  switch (s.kind) {
    case "field":   return "Field Settings";
    case "section": return "Section Settings";
    case "row":     return "Block Settings";
    default:        return "Form Settings";
  }
}

function Body({ form, selected, setSelected }: { form: Form; selected: Selection; setSelected: (s: Selection) => void }) {
  if (selected.kind === "field") {
    const section = form.sections.find((s) => s.id === selected.sectionId);
    if (!section) return null;
    const field = getSectionFields(section).find((f) => f.id === selected.fieldId);
    if (!field) return null;
    const allFields = form.sections.flatMap((s) => getSectionFields(s).filter((x) => x.id !== field.id).map((x) => ({ id: x.id, name: x.displayName })));
    return <FieldConfigPanel form={form} sectionId={section.id} field={field} allFields={allFields} onDelete={() => setSelected({ kind: "none" })} />;
  }
  if (selected.kind === "section") {
    const section = form.sections.find((s) => s.id === selected.sectionId);
    if (!section) return null;
    return <SectionConfigPanel form={form} section={section} onDelete={() => setSelected({ kind: "none" })} />;
  }
  if (selected.kind === "row") {
    const section = form.sections.find((s) => s.id === selected.sectionId);
    const row = section?.rows.find((r) => r.id === selected.rowId);
    if (!section || !row) return null;
    if (row.kind === "richText" || row.kind === "heading" || row.kind === "image" || row.kind === "divider") {
      return <RichTextConfigPanel form={form} sectionId={section.id} row={row} onDelete={() => setSelected({ kind: "none" })} />;
    }
  }
  return <FormSettingsTabs form={form} />;
}
