import type { DragEndEvent } from "@dnd-kit/core";
import type { Form, FormField, FormRow, FieldType } from "@/lib/forms-store";
import { newField, newId } from "@/lib/forms-store";
import { CRM_PROPERTY_CATALOG } from "@/lib/crm-catalog";
import type { DragData, DropData } from "./types";

interface StoreActions {
  addRow: (formId: string, sectionId: string, row: FormRow, index?: number) => void;
  removeRow: (formId: string, sectionId: string, rowId: string) => void;
  moveRow: (formId: string, fromSectionId: string, toSectionId: string, rowId: string, toIndex: number) => void;
  addFieldToRow: (formId: string, sectionId: string, rowId: string, field: FormField, slotIndex?: number) => void;
  moveFieldBetweenRows: (formId: string, fromSectionId: string, fromRowId: string, toSectionId: string, toRowId: string, fieldId: string, toIndex: number) => void;
  reorderSections: (formId: string, ids: string[]) => void;
}

function propertyToField(propertyId: string, allProperties: typeof CRM_PROPERTY_CATALOG): FormField | null {
  const p = allProperties.find((x) => x.id === propertyId);
  if (!p) return null;
  return {
    ...newField(p.defaultFieldType, p.label),
    propertyId: p.id,
    ...(p.options ? { options: p.options } : {}),
  };
}

function emptyRowForLibraryElement(kind: string): FormRow {
  const id = newId();
  switch (kind) {
    case "richText": return { id, kind: "richText", richText: { html: "<p>Start typing…</p>" } };
    case "consent":  return { id, kind: "richText", richText: { html: 'I agree to the <a href="#">Privacy Policy</a> and consent to be contacted.' } };
    case "divider":  return { id, kind: "divider" };
    case "image":    return { id, kind: "image", image: { src: "https://placehold.co/600x200?text=Image", alt: "", align: "center" } };
    case "heading":  return { id, kind: "heading", heading: { text: "Heading", level: 2 } };
    default:         return { id, kind: "divider" };
  }
}

export function handleDragEnd(event: DragEndEvent, form: Form, actions: StoreActions, customProperties: typeof CRM_PROPERTY_CATALOG) {
  const { active, over } = event;
  if (!over) return;
  const a = active.data.current as DragData | undefined;
  const o = over.data.current as DropData | undefined;
  if (!a || !o) return;
  const allProps = [...CRM_PROPERTY_CATALOG, ...customProperties];

  // SECTION REORDER
  if (a.source === "section" && o.kind === "section-list") {
    const ids = form.sections.map((s) => s.id);
    const from = ids.indexOf(a.sectionId);
    if (from < 0) return;
    ids.splice(from, 1);
    const to = Math.max(0, Math.min(o.index, ids.length));
    ids.splice(to, 0, a.sectionId);
    actions.reorderSections(form.id, ids);
    return;
  }

  // LIBRARY -> CANVAS (creates new row)
  if (a.source === "libraryProperty" || a.source === "libraryField" || a.source === "libraryElement") {
    let row: FormRow | null = null;
    if (a.source === "libraryProperty") {
      const fld = propertyToField(a.propertyId, allProps);
      if (!fld) return;
      row = { id: newId(), kind: "fields", fields: [{ ...fld, width: "full" }] };
    } else if (a.source === "libraryField") {
      const fld = newField(a.fieldType as FieldType, a.displayName);
      row = { id: newId(), kind: "fields", fields: [{ ...fld, width: "full" }] };
    } else {
      row = emptyRowForLibraryElement(a.elementKind);
    }
    if (!row) return;

    if (o.kind === "row-slot" && row.kind === "fields" && row.fields) {
      actions.addFieldToRow(form.id, o.sectionId, o.rowId, row.fields[0], o.slotIndex);
    } else if (o.kind === "between-rows") {
      actions.addRow(form.id, o.sectionId, row, o.index);
    } else if (o.kind === "section-area") {
      actions.addRow(form.id, o.sectionId, row);
    } else if (o.kind === "row") {
      // dropped onto a row body: append to its section
      const section = form.sections.find((s) => s.id === o.sectionId);
      if (!section) return;
      const idx = section.rows.findIndex((r) => r.id === o.rowId);
      actions.addRow(form.id, o.sectionId, row, idx + 1);
    }
    return;
  }

  // ROW REORDER within / across sections
  if (a.source === "row") {
    let toSection = a.sectionId;
    let toIndex = 0;
    if (o.kind === "between-rows") {
      toSection = o.sectionId;
      toIndex = o.index;
    } else if (o.kind === "row") {
      toSection = o.sectionId;
      const section = form.sections.find((s) => s.id === toSection);
      if (!section) return;
      toIndex = section.rows.findIndex((r) => r.id === o.rowId);
      if (toIndex < 0) toIndex = section.rows.length;
    } else if (o.kind === "section-area") {
      toSection = o.sectionId;
      const section = form.sections.find((s) => s.id === toSection);
      toIndex = section ? section.rows.length : 0;
    } else {
      return;
    }
    actions.moveRow(form.id, a.sectionId, toSection, a.rowId, toIndex);
    return;
  }

  // FIELD WITHIN / ACROSS ROWS
  if (a.source === "field") {
    if (o.kind === "row-slot") {
      actions.moveFieldBetweenRows(form.id, a.sectionId, a.rowId, o.sectionId, o.rowId, a.fieldId, o.slotIndex);
    } else if (o.kind === "row" && o.rowId !== a.rowId) {
      actions.moveFieldBetweenRows(form.id, a.sectionId, a.rowId, o.sectionId, o.rowId, a.fieldId, 99);
    }
    return;
  }
}
