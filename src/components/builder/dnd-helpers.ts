import type { DragEndEvent } from "@dnd-kit/core";
import type { Form, FormField, FormRow, FieldType } from "@/lib/forms-store";
import { newField, newId } from "@/lib/forms-store";
import { CRM_PROPERTIES } from "@/lib/crm-catalog";
import type { DragData, DropData } from "./types";

interface StoreActions {
  addRow: (formId: string, sectionId: string, row: FormRow, index?: number) => void;
  removeRow: (formId: string, sectionId: string, rowId: string) => void;
  moveRow: (formId: string, fromSectionId: string, toSectionId: string, rowId: string, toIndex: number) => void;
  addFieldToRow: (formId: string, sectionId: string, rowId: string, field: FormField, slotIndex?: number) => void;
  moveFieldBetweenRows: (formId: string, fromSectionId: string, fromRowId: string, toSectionId: string, toRowId: string, fieldId: string, toIndex: number) => void;
  moveFieldToNewRow: (formId: string, fromSectionId: string, fromRowId: string, toSectionId: string, toRowIndex: number, fieldId: string) => void;
  reorderSections: (formId: string, ids: string[]) => void;
}

function propertyToField(propertyId: string, allProperties: typeof CRM_PROPERTIES): FormField | null {
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

export function handleDragEnd(event: DragEndEvent, form: Form, actions: StoreActions, customProperties: typeof CRM_PROPERTIES) {
  const { active, over } = event;
  if (!over) return;
  const a = active.data.current as DragData | undefined;
  if (!a) return;
  const allProps = [...CRM_PROPERTIES, ...customProperties];

  // SECTION REORDER via SortableContext.
  // When a section is dragged over another section, dnd-kit's SortableContext
  // sets over.id = "section-<targetId>". The drop target may not carry our
  // DropData (sortable's own metadata wins), so match on the id prefix.
  if (a.source === "section") {
    const overId = String(over.id);
    if (overId.startsWith("section-")) {
      const targetId = overId.slice("section-".length);
      if (targetId === a.sectionId) return;
      const ids = form.sections.map((s) => s.id);
      const from = ids.indexOf(a.sectionId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      ids.splice(from, 1);
      ids.splice(to, 0, a.sectionId);
      actions.reorderSections(form.id, ids);
    }
    return;
  }

  const o = over.data.current as DropData | undefined;
  if (!o) return;

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
      // Dropping a field into an existing field row's slot inserts it side-by-side.
      // The 3-field cap is enforced in addFieldToRow (silently ignored if exceeded).
      const targetSection = form.sections.find((s) => s.id === o.sectionId);
      const targetRow = targetSection?.rows.find((r) => r.id === o.rowId);
      const existingCount = targetRow?.fields?.length ?? 0;
      if (existingCount >= 3) {
        if (typeof window !== "undefined") {
          console.warn("Row already has 3 fields; cannot add more. Drop on a different row or create a new row.");
        }
        return;
      }
      actions.addFieldToRow(form.id, o.sectionId, o.rowId, row.fields[0], o.slotIndex);
    } else if (o.kind === "row-slot") {
      // Dropping a non-field library element (rich text, divider, etc.) on a row-slot
      // makes no sense as a sibling — insert it as a new row above the slot's row instead.
      const section = form.sections.find((s) => s.id === o.sectionId);
      if (!section) return;
      const idx = section.rows.findIndex((r) => r.id === o.rowId);
      actions.addRow(form.id, o.sectionId, row, Math.max(0, idx));
    } else if (o.kind === "between-rows") {
      actions.addRow(form.id, o.sectionId, row, o.index);
    } else if (o.kind === "section-area") {
      actions.addRow(form.id, o.sectionId, row);
    } else if (o.kind === "row") {
      // dropped onto a row body: append below that row in its section
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
    // Dropping onto a row-slot inserts the field side-by-side with the row's existing
    // fields (extracting it from its source row first). Respects the 3-field cap.
    if (o.kind === "row-slot") {
      // Don't allow dropping into the same field's current row slot adjacent to itself.
      if (o.rowId === a.rowId) {
        // Reordering within the same row — moveFieldBetweenRows handles this safely.
        actions.moveFieldBetweenRows(form.id, a.sectionId, a.rowId, o.sectionId, o.rowId, a.fieldId, o.slotIndex);
        return;
      }
      const targetSection = form.sections.find((s) => s.id === o.sectionId);
      const targetRow = targetSection?.rows.find((r) => r.id === o.rowId);
      const existingCount = targetRow?.fields?.length ?? 0;
      if (existingCount >= 3) {
        if (typeof window !== "undefined") {
          console.warn("Row already has 3 fields; cannot add more.");
        }
        return;
      }
      actions.moveFieldBetweenRows(form.id, a.sectionId, a.rowId, o.sectionId, o.rowId, a.fieldId, o.slotIndex);
      return;
    }
    // Dropping onto a row's body (not its slot) → place the field as a new full-width
    // row below that row in its section.
    if (o.kind === "row") {
      if (o.rowId === a.rowId) return; // no-op: dropped on own row
      const section = form.sections.find((s) => s.id === o.sectionId);
      if (!section) return;
      const idx = section.rows.findIndex((r) => r.id === o.rowId);
      actions.moveFieldToNewRow(form.id, a.sectionId, a.rowId, o.sectionId, idx + 1, a.fieldId);
      return;
    }
    // Dropping into the gap between rows → insert as a new full-width row at that index.
    if (o.kind === "between-rows") {
      actions.moveFieldToNewRow(form.id, a.sectionId, a.rowId, o.sectionId, o.index, a.fieldId);
      return;
    }
    // Dropping into an empty section / after-last-section / between-sections strip
    // (all dispatch with kind "section-area" pointing at the receiving section) →
    // append as a new full-width row at the end of that section.
    if (o.kind === "section-area") {
      const section = form.sections.find((s) => s.id === o.sectionId);
      if (!section) return;
      actions.moveFieldToNewRow(form.id, a.sectionId, a.rowId, o.sectionId, section.rows.length, a.fieldId);
      return;
    }
    return;
  }
}
