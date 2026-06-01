# Form Builder Rebuild — HubSpot-Style 3-Panel Editor

## Context

The current Form Builder (`src/routes/forms.builder.$formId.tsx`, ~1,393 lines, inline) is a functional MVP: 3 panels, native HTML5 DnD, single-column field stacks inside sections, no property library, no rich-text/divider blocks, CRM properties hardcoded inline in the right panel. We're replacing it with a HubSpot-style editor:

- **Left panel** = searchable Property Library with three tabs (Fields / Properties / Other), drag fields onto canvas.
- **Center canvas** = visual form with row-based layouts (1 / 2 / 3 fields side-by-side), section headers, rich-text/divider/image blocks.
- **Right panel** = context-sensitive (field config / section config / rich text config / form-level settings tabs).

Plus 6 "better than HubSpot" features: Quick Add toggles, Kai AI suggestions, conditional validation, "Other with text field" option, first-class Rich Text blocks, explicit width controls.

User decisions captured in planning:
- **Migration**: auto-migrate existing forms by wrapping each field in a full-width row (no data loss).
- **Property catalog**: hardcoded seed `CRM_PROPERTY_CATALOG` in code; custom properties created via the Properties tab persist globally in the forms-store.
- **Structure**: extract into `src/components/builder/` (~10–12 files); route file becomes a thin shell.

DnD library: switch from native HTML5 to `@dnd-kit/core` + `@dnd-kit/sortable` (already in deps, currently unused). This is required to get HubSpot-quality drag UX (multi-zone drop indicators, smooth reorder animations, sortable rows + sortable fields-within-row nested contexts).

---

## Data model changes (`src/lib/forms-store.tsx`)

### 1. Row-based layout
Replace `FormSection.fields: FormField[]` with `FormSection.rows: FormRow[]`.

```ts
export interface FormRow {
  id: string;
  kind: "fields" | "richText" | "divider" | "image" | "heading";
  // For kind === "fields":
  fields?: FormField[]; // 1, 2, or 3 fields side-by-side
  // For kind === "richText":
  richText?: { html: string };
  // For kind === "image":
  image?: { src: string; alt?: string; align?: "left" | "center" | "right" };
  // For kind === "heading":
  heading?: { text: string; level: 2 | 3 };
}
```

Add `FormField.width?: "full" | "half" | "third"` (computed default from row length, but explicit overrides supported).

### 2. CRM property catalog (new file `src/lib/crm-catalog.ts`)
```ts
export type CrmObjectType = "contact" | "company" | "deal" | "custom";
export interface CrmProperty {
  id: string;             // e.g., "contact.email"
  label: string;
  objectType: CrmObjectType;
  group: string;          // "Contact Information", "Company Information", ...
  defaultFieldType: FieldType;
  commonlyUsed?: boolean; // green dot
}
export const CRM_PROPERTY_CATALOG: CrmProperty[] = [/* seed */];
export const PROPERTY_GROUPS: { name: string; objectType: CrmObjectType }[] = [...];
```

Groups: Contact Information, Company Information, Address, Deal Information, Trade Show, Custom Properties.

### 3. Custom properties in store
Add `customProperties: CrmProperty[]` at store root + `addCustomProperty(prop)`. Persists alongside forms.

### 4. Link field → property
Add `FormField.propertyId?: string` so the right panel can show "Property Link" and prevent dragging the same property twice.

### 5. Migration
On store hydration / form load, if a form has `sections[].fields` but no `rows`, convert each field into a `kind: "fields"` row containing that single field (full width). Old field list dropped after migration. Keep this in `getForm()` or a `migrateForm()` helper.

### 6. New actions
- `addRow(formId, sectionId, row, index?)`
- `removeRow(formId, sectionId, rowId)`
- `moveRow(formId, fromSectionId, toSectionId, rowId, toIndex)`
- `addFieldToRow(formId, sectionId, rowId, field, slotIndex?)` — only valid for `kind: "fields"`, max 3 fields per row
- `moveFieldBetweenRows(...)` — handles all the drag-into-existing-row vs drag-into-new-row cases
- `updateRow(formId, sectionId, rowId, patch)` — for richText/image/heading edits
- `addCustomProperty(prop)`

---

## Component structure (`src/components/builder/`)

| File | Purpose |
|---|---|
| `BuilderShell.tsx` | Top-level 3-panel layout + DndContext + sensors + `onDragEnd` orchestrator. Owns selection state (`selected: {kind, id} | null`). |
| `TopBar.tsx` | Form name (inline edit), status badge, Undo/Redo, Preview, Publish, kebab menu. |
| `LeftPanel.tsx` | Tab switcher (Fields/Properties/Other) + search + "+ Add Section" pinned at bottom. |
| `LeftPanelFields.tsx` | "Fields in this form" + "Available fields" (grouped accordions), Kai suggestion banner, drag sources via `useDraggable`. |
| `LeftPanelProperties.tsx` | Same groups + inline "Create Property" form (label, objectType, group, fieldType chip selector, options builder for select types). |
| `LeftPanelOther.tsx` | Drag sources for Rich Text, Divider, Image, Heading. |
| `Canvas.tsx` | Sortable list of section blocks. Empty state. Auto-scroll on edge drag. |
| `SectionBlock.tsx` | Section header bar (name, Quick Add toggle, Show toggle, kebab) + sortable list of rows. |
| `Row.tsx` | Renders a row. For `kind:"fields"`, sortable horizontal slot list (1–3 fields) with vertical drop indicators between/around fields. For richText/divider/image/heading, renders that element. |
| `FieldCard.tsx` | Field preview tile: label + type badge + faux input + hover toolbar (drag handle, width control, duplicate, delete). Selected state = solid blue border. |
| `RightPanel.tsx` | Context-sensitive dispatcher based on `selected`. |
| `panels/FieldConfigPanel.tsx` | Collapsible sections: Field Settings, Appearance, Validation, Options (select types only), Logic (visibility + conditional validation). |
| `panels/SectionConfigPanel.tsx` | Name, Quick Add, Show, Description, Delete (Keep fields / Delete fields). |
| `panels/RichTextConfigPanel.tsx` | Inline rich text editor controls + font size + color + delete. |
| `panels/FormSettingsTabs.tsx` | 4 tabs (Submission / Automation / Style / Settings) — port from existing `AfterSubmitPanel`, `FormSettingsPanel`, `StylePanel`, `GovernancePanel`. Submission tab gets the new "Contact Matching" UI from prior work. |

Route file (`src/routes/forms.builder.$formId.tsx`) becomes a ~30-line shell that loads the form and renders `<BuilderShell formId={...} />`.

---

## DnD orchestration

Single root `<DndContext>` in `BuilderShell.tsx` with `closestCorners` collision detection. Drag sources:

- **Library properties** (left panel): `useDraggable`, `data: { source: "library", propertyId }`
- **Form-fields list items** (left panel): `useDraggable`, `data: { source: "fieldsList", fieldId, sectionId, rowId }` — same effect as dragging on canvas
- **Other elements** (left panel): `useDraggable`, `data: { source: "library", elementKind: "richText"|"divider"|... }`
- **Rows on canvas**: `useSortable`, `data: { source: "row", rowId, sectionId }`
- **Fields inside a row**: nested `useSortable` per row, `data: { source: "field", fieldId, rowId, sectionId }`
- **Sections**: `useSortable` at top level, `data: { source: "section", sectionId }`

Drop zones (rendered conditionally during drag):
- Horizontal blue line between rows / between sections → drop creates a new full-width row at that position
- Vertical blue line at left/right edge of a field in a `kind:"fields"` row → insert into that row (cap 3)
- Section body "Drop fields here" placeholder for empty sections

`onDragEnd` switch on `active.data.current.source` + `over.data.current` to dispatch the right store action. Use `DragOverlay` to render a translucent ghost.

If a library property is already in use, render it grayed with "In use" + checkmark and set `disabled: true` on `useDraggable`.

---

## "Better than HubSpot" features — where they live

1. **Quick Add toggles**: green pills on `SectionBlock` header + a toggle in `FieldConfigPanel` "Field Settings". Wire to existing `section.quickAdd` and new `field.includedInQuickAdd` (reuse existing `included` flag).
2. **Kai AI suggestions**: purple banner at top of `LeftPanelFields.tsx`, above "Available fields". Hardcoded suggestion logic: if form has "Email" + "Company Name" but no "Industry", suggest Industry / Company Size / Annual Revenue. Click = add to canvas as a new row.
3. **Conditional validation**: new sub-section in `FieldConfigPanel` Logic section. Reuses existing `VisibilityConditions` shape under a new `field.requiredWhen?: VisibilityConditions` prop.
4. **"Allow Other with text field"**: toggle in `FieldConfigPanel` Options section. New `field.allowOther?: boolean`. Submit preview renders an extra "Other: ___" row.
5. **Rich Text + Consent block + Image**: implemented as row kinds; consent is a pre-styled rich-text template inserted via a button in `LeftPanelOther.tsx`.
6. **Width control**: hover toolbar on `FieldCard` (Full/Half/Third segmented) + same control in `FieldConfigPanel` Appearance. Changes `field.width` and re-balances row siblings.

---

## Critical files to be modified / created

**Modified**:
- `src/lib/forms-store.tsx` — add row model, custom-properties slice, new actions, migration on form load
- `src/routes/forms.builder.$formId.tsx` — reduce to a thin shell rendering `<BuilderShell>`
- `package.json` — no new deps (dnd-kit already present)

**Created**:
- `src/lib/crm-catalog.ts` — seed catalog
- `src/components/builder/BuilderShell.tsx`
- `src/components/builder/TopBar.tsx`
- `src/components/builder/LeftPanel.tsx`
- `src/components/builder/LeftPanelFields.tsx`
- `src/components/builder/LeftPanelProperties.tsx`
- `src/components/builder/LeftPanelOther.tsx`
- `src/components/builder/Canvas.tsx`
- `src/components/builder/SectionBlock.tsx`
- `src/components/builder/Row.tsx`
- `src/components/builder/FieldCard.tsx`
- `src/components/builder/RightPanel.tsx`
- `src/components/builder/panels/FieldConfigPanel.tsx`
- `src/components/builder/panels/SectionConfigPanel.tsx`
- `src/components/builder/panels/RichTextConfigPanel.tsx`
- `src/components/builder/panels/FormSettingsTabs.tsx`
- `src/components/builder/dnd-helpers.ts` — `onDragEnd` dispatcher + collision logic
- `src/components/builder/types.ts` — `Selection` discriminated union, drag-data types

**Reused** (port content into the new panel files, don't reinvent):
- The existing `AfterSubmitPanel` content (CRM action, duplicate handling, ticket fields, Contact Matching collapsible) → `FormSettingsTabs.tsx` Submission tab
- The existing `StylePanel`, `FormSettingsPanel`, `GovernancePanel` content → corresponding tabs
- `src/components/ui-kit.tsx` primitives (Toggle, Btn, Badge, DragHandle) — reuse throughout

---

## Implementation order

1. Data model + migration in `forms-store.tsx` + `crm-catalog.ts`. Verify old forms still load (via dev server) and now show as one-field-per-row.
2. `BuilderShell` skeleton with all 3 panels stubbed; route file shrunk. Verify navigation still works.
3. Port form-level settings content into `FormSettingsTabs.tsx`. Verify "click empty canvas → right panel shows submission/automation/style/settings" works.
4. `Canvas` + `SectionBlock` + `Row` + `FieldCard` rendering (no DnD yet). Verify visual fidelity for an existing form.
5. `FieldConfigPanel` + selection state. Verify clicking a field shows config and edits persist.
6. `LeftPanel` Fields tab (incl. Kai banner) + Properties tab + Other tab — drag sources via `useDraggable`.
7. Full DnD wiring in `BuilderShell` + `dnd-helpers.ts`: library → canvas, reorder rows, reorder fields within row, side-by-side drops, section reorder.
8. Rich Text / Divider / Image / Heading rendering + `RichTextConfigPanel`.
9. The 6 "better than HubSpot" features (Quick Add, Kai suggestions, conditional validation, Allow Other, consent block, width control).
10. Polish: animations (dnd-kit `defaultAnimateLayoutChanges`), empty states, hover toolbars, drop indicators.

---

## Verification

Run dev server and walk the full interaction flow from the spec end-to-end:

1. Open an **existing form** (e.g., the seeded Customer Form). Confirm migration: every field renders as a full-width row, no data is lost, CRM/automation/style settings still work.
2. Open a **new blank form**. Verify "Drag fields to start" empty state.
3. From left panel "Fields" tab → expand "Contact Information" → drag **Email** to canvas → it lands as a full-width row.
4. Drag **First Name** to the left of Email → vertical drop indicator appears → drop → row becomes First Name (50%) + Email (50%).
5. Drag **Last Name** into the same row → 33/33/33. Confirm 4th field is rejected.
6. Click "+ Add Section" → name it "Company Details" → drag **Company Name** into it.
7. "Other" tab → drag **Rich Text Block** above Company Details → type a heading; verify inline editor works.
8. "Properties" tab → click **+ Create Property** → create "Trade Show Booth" (Text, Trade Show group). Verify it appears under Trade Show in Available fields and can be dragged to canvas.
9. Click a field → right panel shows Field Settings; toggle Required; verify `*` appears on label in canvas.
10. Open Logic section → add a visibility rule AND a "required when" rule (conditional validation). Verify purple "Conditions" badge appears on the field.
11. On a Select field, enable **Allow Other with text field**; verify the canvas preview shows the "Other: ___" row.
12. Click empty canvas → right panel shows Submission/Automation/Style/Settings tabs. Verify Contact Matching collapsible and ticket flow still work (previously implemented).
13. Hover a field → toolbar appears → toggle width Full/Half/Third → row resizes.
14. Reorder rows by dragging a row's drag handle; reorder sections similarly.
15. Click Preview → form renders as a submitter would see it. Click Publish → status flips to Published (green).
16. Verify no console errors throughout. Run `bun run build` to confirm production build still succeeds (and that Vercel deploy path still works).

Type checking via `tsc --noEmit` and lint via `bun run lint` should both pass.
