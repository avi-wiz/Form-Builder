# WizCommerce Forms — Polish Pass (6 Follow-ups)

All work is frontend-only, in-memory state via existing `FormsStore`. No backend changes.

## 1. Form Builder — Animated Right Panel + Form Settings Tab
File: `src/routes/forms.builder.$formId.tsx`

- Right panel becomes a single always-mounted container with `transition-all duration-300 ease-out` on width/opacity, and inner content cross-fades via `key`-based `animate-fade-in`.
- Tab strip at top of right panel: **Field** | **Form Settings**.
- Default state (no field selected, Field tab): show **After Submission** settings (existing radios: Show thank-you / Redirect URL / Show another form).
- Click a field on canvas → smooth swap to that field's Edit config (display name, type, placeholder, help text, mandatory, type-specific options).
- **Form Settings tab** (new): Form Name input, Description textarea, Status dropdown (Draft / Published / Archived), plus the new **Multi-Step Wizard** toggle (see #3). Writes through `updateForm()` in store.
- Deselect button (X) in panel header to return to After Submission view.

## 2. Form Preview — Kai Dedup Modal
File: `src/routes/forms.preview.$formId.tsx` (+ extract `src/components/KaiDedupModal.tsx`)

- On Submit: set `submitting=true`, show centered spinner overlay 1000ms via `setTimeout`.
- Then open `KaiDedupModal` with 2 mock matches pulled from store customers:
  - Sparkle icon (Lucide `Sparkles`, purple) next to title "Kai found potential duplicates".
  - Each match row: avatar, name, email, **Customer**/**Lead** badge, **similarity %** badge (e.g. 94%, 87%) in amber.
  - Footer: **Discard** (ghost) → close modal, stay on form. **Create Anyway** (primary green) → close, fire `toast.success("Submission created")`, reset form.
- Reuse modal on `/forms/fill/:slug` as well (same component).

## 3. Multi-Step Wizard Mode
Files: builder + preview + fill renderer (`src/components/FormRenderer.tsx` if it exists, else inline).

- Add `multiStep: boolean` to form schema in `forms-store.tsx` (default false).
- Toggle in Form Settings tab (#1).
- Renderer behavior when `multiStep`:
  - Each **section** = one step.
  - **Step indicator** at top: numbered circles, completed = filled green (`bg-primary text-white` + check icon), current = green ring outline, upcoming = gray (`bg-muted text-muted-foreground`). Connecting lines green for completed segments, gray otherwise.
  - Footer: **Back** (ghost, hidden on step 0) + **Next** (primary). Last step shows **Submit**.
  - Next validates all required fields in the current step (existing validation, scoped to section); shows inline errors and blocks advance.

## 4. Workflow Manager Enhancement
File: `src/routes/settings.workflow-manager.$workflowId.tsx`

- Entry Point node: real `<select>` for entity (Orders, Products, Cart, Forms). When Forms selected, render a second `<select>` listing the 5 demo forms from `FormsStore`.
- Left palette adds 4 action node types with Lucide icons:
  - Send Notification — `Bell`
  - Create Task — `CheckSquare`
  - Assign Rep — `UserPlus` (person icon)
  - Create Lead/Deal — `PlusCircle`
- Drag from palette → drop on canvas using native HTML5 drag-and-drop (`draggable`, `onDragStart`, canvas `onDrop` computes x/y from `clientX/Y - rect`). New node appended to local nodes state with default position and label. No edge wiring required beyond what already exists (nodes appear, can be repositioned).

## 5. Mobile Responsive Form Fill
File: `src/routes/forms.fill.$formSlug.tsx` (and shared renderer)

- Container: `max-w-2xl mx-auto px-4 sm:px-6`.
- Field grid: `grid-cols-1 sm:grid-cols-2`, all fields force `col-span-2` (i.e. single column) under `sm`.
- Inputs/buttons: `min-h-[44px]`, larger tap padding on radios/checkboxes.
- Submit becomes **sticky** on mobile: `sm:static fixed bottom-0 inset-x-0 p-4 bg-background border-t shadow-lg z-10`; add bottom padding to scroll area to avoid overlap.
- Step indicator (if multi-step) collapses to compact "Step 2 of 4" + progress bar under 640px.

## 6. Share & Embed — Theme Setting
File: `src/routes/forms.$formId.share.tsx`

- New **Theme** card with segmented control: Light / Dark / Auto.
- Persist on form (`embedTheme` field in store).
- Embed snippet updates to include `data-theme="dark|light|auto"` attribute / query param.
- **Live preview** card below: renders a miniature form (name + 2 inputs + submit button) with the chosen theme tokens:
  - Light: existing.
  - Dark: bg `#1F2937`, text `#F9FAFB`, field bg `#374151`, border `#4B5563`, primary stays `#16A34A`.
  - Auto: uses `prefers-color-scheme` via a wrapper class.

## Technical Notes
- Animations: Tailwind `transition-*` + existing `animate-fade-in` keyframe (already in `src/styles.css`). No new deps.
- Store additions: `multiStep`, `embedTheme` fields on form; `updateForm` already supports partial patches.
- Native HTML5 DnD for workflow palette (no `@dnd-kit` needed for this step).
- All copy/icons use Lucide React already installed.

## Out of Scope
- Real persistence, real CRM lookups for Kai, edge connection drawing UX, embed runtime on third-party sites.
