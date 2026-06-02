# WizForms Builder — Project Overview

**Audience**: Head of Product, Head of Engineering
**Status**: Working prototype, deployed to Vercel
**Live URL**: https://wiz-forms-builder.vercel.app
**Repo**: https://github.com/avi-wiz/Form-Builder

---

## What this is

WizForms Builder is a **clickable prototype** of a HubSpot-style form builder, embedded inside the larger WizCommerce CRM/wholesale platform. It demonstrates the end-to-end flow for a non-technical admin to design, deploy, and operate forms — capturing leads, RFQs, post-sale feedback, trade-show signups — and to wire those submissions into the CRM (lead/deal/ticket creation, contact matching, follow-up automation, workflow routing).

It is **not** production code. Data lives in React state (`FormsStoreProvider`) seeded with five example forms; there is no API, no auth integration, no real submission pipeline. The goal is to validate the UX and information architecture before engineering builds the real thing.

---

## Why we built this

Sales reps capturing leads at trade shows currently bounce between three tools (HubSpot, Salesforce, internal CRM) and lose context. Wholesale buyers requesting quotes have no consistent intake. Support tickets land in shared inboxes. The forms surface in the WizCommerce platform is the connective tissue: a single form builder that admins control, with every submission routed through the same CRM/automation rails.

Two things make this version differentiated from a stock HubSpot embed:

1. **Trade-show Quick Add mode** — section- and field-level toggles that produce a streamlined form for reps to fill in seconds at a booth, while still using the same underlying form definition as the full version.
2. **Kai (AI) integration points** — duplicate-detection notes on Contact Matching, property suggestions in the builder, automation rule recommendations. Currently rendered as static prompts so reviewers can see where AI will plug in.

---

## Scope of the prototype

### Modules implemented

| Module | Route | What it covers |
|---|---|---|
| Forms index | `/forms` | List, search, create, clone, archive, delete forms |
| Form Builder | `/forms/builder/:formId` | HubSpot-style 3-panel editor (rebuilt June 2026) |
| Form Preview | `/forms/preview/:formId` | Submitter-facing render with conditional visibility, multi-step, row-based layouts |
| Form Fill (public) | `/forms/fill/:formSlug` | Public-facing URL the form can be embedded at |
| Submissions inbox | `/forms/:formId/submissions` | Per-form list of received submissions with status tracking |
| Form Analytics | `/forms/:formId/analytics` | View count, submission count, conversion charts |
| Share / Embed | `/forms/:formId/share` | Embed code, QR code, public URL |
| Workflow Manager | `/settings/workflow-manager/:workflowId` | Visual node-based workflow (entry → condition → action) for routing submissions |
| Customer detail | `/customers/:customerId` | Existing CRM screen that hosts the "Customer Form" Quick Add experience |

### What's intentionally out of scope

- Authentication & permissions enforcement (the Settings tab in the builder defines roles, but they aren't checked anywhere)
- Real submission persistence (submissions are React state, lost on refresh)
- Live API integration with HubSpot / Salesforce / internal CRM
- File upload backend (file fields render but don't store anything)
- Email delivery (templates exist, no SMTP)
- CAPTCHA verification (toggle exists, no actual verification)
- Multi-tenancy / org switching

---

## Form Builder — the centerpiece

The Form Builder was rebuilt end-to-end in late May / early June 2026 to match the HubSpot 3-panel pattern. Before the rebuild it was a 1,400-line inline route file with native HTML5 drag-and-drop; today it's ~12 lines that mount `<BuilderShell>`, with the heavy lifting in 18 modular components under `src/components/builder/`.

### Layout

```
┌──────────────┬─────────────────────────────────────┬──────────────────┐
│              │                                     │                  │
│  Property    │           Form Canvas               │  Configuration   │
│  Library     │                                     │                  │
│  (280px)     │     (flex, max-w-4xl, scrolls)      │     (320px)      │
│              │                                     │                  │
└──────────────┴─────────────────────────────────────┴──────────────────┘
```

### Left panel — Property Library

Three tabs:

- **Fields**: searchable list of fields already on the form + grouped "Available fields" (Contact Information, Company Information, Address, Deal Information, Trade Show, Custom Properties). Drag any property onto the canvas to add it as a field. Properties already in use are grayed out with a checkmark to prevent duplicates. A purple "Kai suggests" banner surfaces contextual recommendations (e.g. "you have Email and Company Name — consider adding Industry, Company Size, Annual Revenue").
- **Properties**: same catalog, plus an inline "+ Create Property" form so admins create new CRM properties without leaving the builder.
- **Other**: drag sources for layout elements (Rich Text, Heading, Divider, Image), a one-click "Consent Block" template, and raw field-type cards for fields not tied to a CRM property.

A pinned "+ Add Section" button at the bottom creates a new section divider on the canvas.

### Center canvas — visual form

- **Row-based layout**: each section contains rows. A row can hold 1, 2, or 3 fields side-by-side (HubSpot cap) OR a single non-field element (rich text, heading, divider, image).
- **Sections** are full-width bars with Quick Add and Show toggles, drag handle, delete, and an "Add empty row" button.
- **Field cards** show display label, type badge, faux input preview, and a hover toolbar (drag handle, width control 100/50/33, duplicate, delete). Conditions and "required when" rules surface as colored badges.
- **Drag-and-drop** uses `@dnd-kit/core` + `@dnd-kit/sortable` with a custom collision algorithm (pointer-within, prioritizing the narrow inter-row / inter-section drop strips over the larger section card behind them). Drop indicators only appear during an active drag — visible dashed strips with "Drop here" / "Drop between sections" / "Insert at top" labels — so the canvas stays clean otherwise.

### Right panel — context-sensitive configuration

Switches based on what's selected:

| Selection | Panel contents |
|---|---|
| Nothing (empty canvas click) | Form-level tabs: **Submission / Automation / Style / Settings** |
| A field | Field Settings (display name, type, placeholder, help text, required, hidden), Appearance (width with live sibling rebalance), Validation (min/max length, regex pattern, custom error message — for text/email/phone/url/long_text), Options (add/edit/delete/drag-reorder + Allow Other — for select/multi_select/radio), Logic (Visibility Conditions + Conditional Validation) |
| A section header | Name, Description, Quick Add toggle, Show toggle, Delete |
| A Rich Text / Heading / Image row | Inline editor for that element |

**Submission tab** is where CRM wiring lives: pick the action (none / lead / deal / lead+deal / Create Support Ticket), map fields to CRM properties, and configure Contact Matching (match by Email/Company/Phone, with a "When a match is found" disposition). For Lead/Deal actions: form-field → CRM-property mapping table, duplicate handling (Update / Create anyway / Skip), and amber overwrite warning. For Support Ticket: a ticket-property-first table (Subject / Description / Priority / Type, each mapped to a form field), Default Priority and Default Type dropdowns, and a blue note confirming the Claims module assignment. Switching CRM action clears the field map to prevent stale mappings carrying over.

**Automation tab**: send a follow-up email (with template picker), notify team, notify the assigned Sales Rep (independent toggle), create a task with title interpolation (e.g. `Follow up with {{Company Name}}`), Kai-powered dedup.

**Style tab**: live-preview color / font / radius / submit-text edits.

**Settings tab**: governance — role × CRUD permissions (Admin / Sales Manager / Sales Rep), CAPTCHA, GDPR consent footer, multi-step toggle (converts each section into a wizard step on preview).

### Differentiators over HubSpot

Six features beyond HubSpot's builder:

1. Quick Add toggles per section AND per field (for the trade-show streamlined mode).
2. Kai property suggestions (contextual, clickable to insert).
3. Conditional validation — make a field required only when another field has a specific value (HubSpot only does conditional show/hide).
4. "Allow Other with text field" toggle on select/radio fields.
5. Rich Text + Consent block as first-class row kinds with a pre-styled consent template.
6. Explicit field-width controls (100/50/33) on the hover toolbar AND in the Appearance panel.

---

## Architecture (just enough)

### Stack

- **Framework**: TanStack Start (SSR via Nitro) + TanStack Router, React 19
- **Build**: Vite + Bun
- **Styling**: Tailwind v4 (`@tailwindcss/vite`)
- **UI primitives**: Radix UI components + custom `ui-kit.tsx` (Toggle, Btn, Badge, Modal, DragHandle)
- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Icons**: lucide-react
- **Charts**: recharts (in Form Analytics)
- **Deployment**: Vercel (with a custom `build-vercel.mjs` adapter — see below)

### State

A single React Context (`FormsStoreProvider` in [src/lib/forms-store.tsx](src/lib/forms-store.tsx)) holds all forms, submissions, customers, workflows, and custom properties. Seed data ships inline. No persistence layer — refresh resets everything to the seeds.

Key types:

- `Form` → has `sections: FormSection[]`, plus `crm`, `automation`, `style`, `governance`, `afterSubmit` config
- `FormSection` → has `rows: FormRow[]`, plus `name`, `quickAdd`, `show`
- `FormRow` → discriminated union: `kind: "fields" | "richText" | "divider" | "image" | "heading"`. Fields rows can hold 1–3 `FormField`s.
- `FormField` → 18 field types (text/email/phone/select/multi_select/radio/rating/file/currency/percentage/url/long_text/html/checkbox/date/hidden/consent), plus optional `width`, `propertyId` (link to CRM property), `conditions` (visibility), `requiredWhen` (conditional validation), `allowOther`.
- `CrmProperty` (in [src/lib/crm-catalog.ts](src/lib/crm-catalog.ts)) → 24 seeded properties across 5 groups, plus a runtime-populated Custom Properties slice.

### Code organization

```
src/
  routes/                     # TanStack Router file-based routes
    forms.builder.$formId.tsx # 12 lines — mounts <BuilderShell>
    forms.preview.$formId.tsx # Submitter-facing render
    ...
  components/
    builder/                  # All Form Builder UI (18 files)
      BuilderShell.tsx        # DndContext + custom collision + selection state
      TopBar.tsx
      LeftPanel.tsx + LeftPanelFields/Properties/Other.tsx
      Canvas.tsx + SectionBlock.tsx + Row.tsx + FieldCard.tsx
      RightPanel.tsx + panels/{Field,Section,RichText,FormSettings}.tsx
      dnd-helpers.ts          # onDragEnd dispatcher
      types.ts                # Selection, DragData, DropData unions
    layout/AppShell.tsx       # Top-level shell with sidebar nav
    ui-kit.tsx                # Toggle, Btn, Badge, Modal, DragHandle
    ui/                       # shadcn-style Radix wrappers (sonner toaster, etc.)
  lib/
    forms-store.tsx           # React Context store + seed data + migration
    crm-catalog.ts            # 24 seeded CRM properties
```

### Notable architectural decisions

- **Row-based form layout** — added in the June rebuild. Sections used to be flat field lists; now they're lists of rows that can each hold 1–3 fields or a non-field element. Legacy field-list data auto-migrates on load (`migrateForm()` in forms-store).
- **Single root `DndContext`** in BuilderShell with **custom collision detection** that prioritizes narrow drop strips via id-prefix matching (`between-`, `top-`, `after-`, `btw-`, `slot-`). Avoids the standard `closestCorners` behavior where the large section card always wins over the thin drop strip behind it.
- **Drop strips render only during drag** (via `useDndContext().active`). Keeps the canvas visually clean when idle, gives clear visual feedback when active.
- **All `useSortable` items** for sections live inside a single `SortableContext` with `verticalListSortingStrategy` so section reorder works through dnd-kit's native sortable handling.

---

## Deployment

Vercel builds were initially broken because:

1. The Lovable scaffold (`@lovable.dev/vite-tanstack-config`) defaults Nitro to the Cloudflare preset. We override to `preset: "vercel"`.
2. Nitro's Vercel preset emits a web-fetch handler (`export default { fetch(req) }`) but Vercel's Node runtime expects a Node `(req, res)` handler.

Fix: a custom [build-vercel.mjs](build-vercel.mjs) script runs after `vite build`. It:

1. Copies Nitro's `dist/` output into `.vercel/output/` per the Vercel Build Output API v3.
2. Writes a Node.js adapter (`vercel-handler.mjs`) that wraps Nitro's web-fetch handler so Vercel's Node runtime can invoke it.
3. Writes the function's `.vc-config.json`.

Build command: `bun run build` (which is `vite build && node build-vercel.mjs`).
Output directory: `.vercel/output`.
Deploy: `vercel --prod --scope avi-wizs-projects` (the project.json scope was hardcoded to a stale team ID, so the explicit `--scope` flag is required).

---

## What's been tested manually

The full prototype has been walked end-to-end via the **15-flow platform test script** (kept locally, not in repo). Key flows verified:

- ✅ Form lifecycle (create / clone / archive / delete from `/forms`)
- ✅ Migration of legacy seeded forms (`f_trade_show`, `f_contact`, `f_rfq`, `f_account`, `f_feedback`) into the new row-based model — no data loss
- ✅ HubSpot-style build flow: drag fields, side-by-side rows, sections, rich text / divider / heading / image
- ✅ Custom property creation in Properties tab persists to the in-memory catalog
- ✅ Kai suggestion banner surfaces when Email + Company Name are present but Industry is not
- ✅ Field config: required toggle, hidden toggle (switches field type to `hidden` in-place), width control with sibling rebalancing, visibility conditions, conditional validation
- ✅ Validation rules on text/email/phone/url/long_text fields: min length, max length, regex pattern, custom error message — enforced on preview submit
- ✅ Options panel on select/multi_select/radio fields: add, edit, delete, drag-to-reorder via grip handle; Allow Other toggle surfaces "Other: ___" sub-row on field card
- ✅ Form-level Submission flow: Create Lead, Create Deal, Create Lead+Deal, Create Support Ticket — each with appropriate field mapping UI
- ✅ Support Ticket mapping redesigned: ticket-property-first table (Subject / Description / Priority / Type → pick form field), Default Priority + Default Type dropdowns, blue Claims module note; duplicate-handling block hidden for ticket action
- ✅ CRM action switch clears fieldMap to prevent stale lead mappings appearing in ticket view
- ✅ Automation flow with Notify Assigned Sales Rep as an independent toggle
- ✅ Section reorder via SortableContext
- ✅ Drag-drop edge cases (3-field cap, drop between sections, drop above first section, drop below last section, field cross-section move)
- ✅ Form Preview renders multi-field rows side-by-side, supports multi-step, runs visibility logic live
- ✅ Workflow Manager: condition node, assign-rep node, and entry node all show real config panels (not placeholders)
- ✅ TopBar kebab menu: Clone form (navigates to clone), Export JSON (downloads `.json`), View Submissions (navigates to inbox), Delete form (confirm dialog)
- ✅ Vercel production deploy renders SSR HTML correctly

### Known prototype limitations

- Undo / Redo are visual stubs (no history stack)
- Rich Text editing is a raw-HTML textarea (no WYSIWYG library — `tiptap` or similar would be the production choice)
- Consent Block in the Other tab inserts a richText row (styled HTML) rather than a true `consent`-type field with a real checkbox — acceptable for demo; production would use the `consent` field type
- The Properties-tab catalog persists only for the session
- 3-field cap rejection is silent (logs a console warning, no toast)
- The drop strips appear only when *something* is being dragged — they don't pre-emptively show "drop targets" before the user picks something up
- Validation rules (min/max length, pattern) are enforced in preview but not surfaced visually on the field card in the builder

---

## What we'd need from Engineering to ship this

1. **Persistence layer** — a real CRUD API for forms, submissions, customers, workflows, custom properties. Probably Postgres + a thin server (TanStack Start already runs server functions; the schema is mirrored from the TypeScript types in `forms-store.tsx`).
2. **Auth & RBAC enforcement** — the Settings tab models permissions; need a middleware to actually enforce them on the server.
3. **CRM integrations** — adapters for HubSpot / Salesforce / internal CRM that consume the `CRMConfig` shape and call out to the right system on submission.
4. **File upload backend** — likely S3 + signed URLs for the file field.
5. **Email delivery + templating** — SendGrid / Postmark integration with merge-tag support for the existing `{{field}}` interpolation.
6. **CAPTCHA verification** — server-side reCAPTCHA / hCaptcha check.
7. **Real Kai integration** — replace the hardcoded suggestion banner and dedup notes with calls to the AI service.
8. **Form versioning** — admins editing a published form shouldn't break submissions in flight. Need draft-vs-published separation.
9. **Submission webhooks / event bus** — so workflow manager actions can run async (assign rep, create task, send notification).
10. **A proper rich text editor** — Tiptap is the obvious choice given the React stack.

---

## What we'd need from Product to ship this

1. **Field-type completeness review** — confirm we have every type a wholesale buyer / trade-show rep would use (e.g., signature, address autocomplete, country-aware phone, multi-file).
2. **CRM property schema** — the seeded catalog is a placeholder; the real list needs to come from the source CRM (HubSpot has hundreds).
3. **Multi-step / wizard polish** — Settings has a multi-step toggle; the actual stepper UX in `/forms/preview` is minimal. Needs progress indicators, validation per step, save-and-resume.
4. **Mobile experience** — the builder is desktop-only. The Fill / Preview experience needs a mobile-optimized layout (mobile is where 80% of trade-show submissions will happen).
5. **Analytics depth** — current `forms.$formId.analytics` shows top-line view/submission counts and a chart. Real product needs funnel analytics, time-to-submit, drop-off-by-field, source attribution.
6. **Quick Add UX research** — the green Quick Add toggles assume a specific trade-show workflow. Sales should validate it matches what reps actually do at booths.
7. **Pricing / packaging** — which features are gated to which tier? Conditional validation, Workflow Manager, custom properties, multi-step, embed customization — all candidates.
8. **Migration path for HubSpot customers** — if we're displacing HubSpot, we need a HubSpot form importer.

---

## Quick links

- **Form Builder rebuild plan** — [Plan.md](Plan.md)
- **Original UX spec** — [form-builder-revamp.md](form-builder-revamp.md)
- **Build adapter** — [build-vercel.mjs](build-vercel.mjs)
- **Store + types** — [src/lib/forms-store.tsx](src/lib/forms-store.tsx)
- **CRM property catalog** — [src/lib/crm-catalog.ts](src/lib/crm-catalog.ts)
- **Builder entry point** — [src/components/builder/BuilderShell.tsx](src/components/builder/BuilderShell.tsx)
