# CLAUDE.md

## Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

## Project

WizForms — the form builder module of WizCommerce, a B2B wholesale/distributor commerce platform. This is a React frontend prototype (no real backend — all data is in-memory React state and seeded mock data). It runs on Lovable/Vite with bun.

## Current State

We are migrating from V1 (generic CRM model: Lead, Deal, Ticket, Contact, Company) to V2 (wholesale-native entity model with 19 entities).

## Tech Stack

- React 19 + TypeScript (strict)
- Tailwind CSS v4
- **TanStack Router** (file-based in `src/routes/`)
- **Radix UI + shadcn/ui** component primitives
- @dnd-kit for drag-and-drop
- Recharts for analytics
- Lucide React for icons
- react-hook-form + zod
- TanStack Query
- Vite as build tool
- No backend — mock data in `src/lib/forms-store.tsx`

## Commands

```bash
bun run dev        # start dev server
bun run build      # production build — must pass before any PR
bun run tsc --noEmit  # type check — must pass after every change
bun run lint       # linting — must pass
```

## File Structure

```
src/
├── lib/
│   ├── crm-catalog.ts          # THE FOUNDATION — entity types, property catalog, helpers
│   ├── forms-store.tsx          # form state, CRMConfig, seed forms, seed workflows, RetailerAccount type
│   └── utils.ts
├── components/
│   └── builder/
│       ├── LeftPanelFields.tsx       # left panel "Fields" tab — property library grouped by entity
│       ├── LeftPanelProperties.tsx   # left panel "Properties" tab — + Create Property
│       ├── FormCanvas.tsx            # center panel — drag-drop canvas
│       └── panels/
│           ├── FormSettingsTabs.tsx   # right panel tabs: Submission, Automation, Style, Settings
│           └── FieldConfigPanel.tsx   # right panel when a field is selected
├── routes/
│   ├── forms.tsx                     # /forms — dashboard
│   ├── forms.builder.$formId.tsx     # /forms/builder/:formId — the builder
│   ├── retailers.$retailerId.tsx     # /retailers/:id — detail page (was customers.$customerId.tsx)
│   └── settings.workflow-manager.$workflowId.tsx  # workflow manager
└── components/layout/
    └── AppShell.tsx                  # sidebar navigation, top bar
```

## The Entity Model (V2)

This is the core concept. Everything in the codebase flows from this.

**19 entities total:**

- 13 createable (forms can create these): Retailer Account, Buyer Contact, Quote, Order, Standing Order, Sample Request, Credit Application, Tax Exemption Certificate, Claim/RMA, Vendor, Trade Show, Ticket, Activity
- 6 reference-only (used as lookup targets, not created by forms): Sales Rep, Rep Group, Price List, Payment Method, Store Location, SKU

**Critical conceptual rule:** There is NO separate "Lead" entity. A Lead is a Retailer Account with `opening_order_status = "prospect"`. There is no lead-to-customer conversion event. The CRM action `create_retailer_account` with `defaults.opening_order_status = "prospect"` replaces the old `create_lead`.

**CRM actions enum:**

```
none | create_retailer_account | create_buyer_contact | create_quote | create_order |
create_standing_order | create_sample_request | create_credit_application |
create_tax_exemption | create_claim | create_vendor | create_ticket | log_activity
```

## Key Files to Understand Before Editing

1. **`src/lib/crm-catalog.ts`** — Read this first. Contains `EntityType`, `CrmAction`, `CrmPropertySeed`, `PROPERTY_GROUPS`, `CRM_PROPERTIES` (the full property catalog ~200 properties), and helper functions (`getPropertiesForEntity`, `getEntityLabel`, `getActionLabel`, `getDefaultMatchKeys`). Every UI component reads from this catalog.
2. **`src/lib/forms-store.tsx`** — Contains `CRMConfig` (the shape of a form's CRM settings), `RetailerAccount` type, all 13 seed forms, seed workflows, and the migration logic. If you need to understand what data a form carries, read this.
3. **`V2_Plan.md`** — The migration spec. Contains the full property catalog definition, seed form mappings, component change list, and verification checklist. When in doubt, defer to this document.

## Code Conventions

- **Types over interfaces** for unions and simple shapes. Interfaces for component props.
- **Catalog-driven UI.** The Submission tab, left panel, and field config panel do NOT have per-entity hardcoded rendering. They read from `crm-catalog.ts` and render dynamically. If you find yourself writing `if (action === "create_quote") { ... } else if (action === "create_order") { ... }`, stop — use the catalog.
- **Entity property IDs** follow the pattern `entity.property_name` (e.g., `retailer.legal_name`, `quote.expiry_date`, `claim.claim_type`). Always use this format, never bare property names.
- **Field types:** text | long_text | number | email | phone | date | select | multi_select | checkbox | currency | percentage | file | url | html | hidden | radio | rating | consent | lookup
- **Lookup fields** have a `lookupEntity` property in the catalog that specifies what entity they reference (e.g., `retailer.primary_rep` has `lookupEntity: "sales_rep"`). In the UI, they render as searchable selects with placeholder mock data.
- **Commonly used properties** are marked `commonlyUsed: true` in the catalog and should be visually highlighted (bold or star) in the left panel and field mapping table.
- **helpText** on properties renders as ℹ️ tooltip icons. Many wholesale concepts need explanation: EIN, MAP, EOM, MOQ, blind ship, resale cert, D-U-N-S.
- **Tailwind colors:** Primary green `#16A34A` (bg-green-600). Active toggle green. Status badges: prospect=blue, active=green, dormant=yellow, lost=red. Entity type badges: Retailer=green, Quote=blue, Order=purple, Claim=red.
- **No `console.log` in committed code** except migration warnings (which use `console.warn`).

## Things NOT to Do

- **Do not create separate UI panels per entity.** The `EntityActionPanel` component reads from the catalog. One component handles all 13 entity types.
- **Do not use the words "Lead", "Deal", or "Customer" in UI text.** The correct terms are "Retailer Account" (or "Prospect" for opening_order_status=prospect), "Quote" or "Order", and "Retailer". Search and replace if you find old references.
- **Do not add new files unless absolutely necessary.** V2 reuses the V1 file structure. The V2 plan explicitly states: "Created: (none — V2 reuses V1 file structure)."
- **Do not modify seed form field content unless the prompt specifically asks.** Field layouts on the canvas (which fields exist, their order, their sections) should only change when adding new seed forms or when the prompt says to update existing ones.
- **Do not break backward compatibility of the form builder canvas.** Drag-and-drop, field types, sections, Quick Add/Show toggles, conditional logic, style editor — all must continue working exactly as V1.
- **Do not hardcode property lists.** If you need "all Retailer Account properties", call `getPropertiesForEntity("retailer_account")`. If you need "the default match keys for a Quote", call `getDefaultMatchKeys("create_quote")`. The catalog is the single source of truth.

## Duplicate Matching Rules (Entity-Specific)

These are critical — do not change them:

- **Retailer Account** — match by EIN (primary), legal_name, DBA
- **Buyer Contact** — match by email + phone
- **Vendor** — match by EIN
- **Standing Order** — match by retailer + name
- **Credit Application** — match by retailer + status
- **Tax Exemption Certificate** — match by retailer + state
- **Quote, Order, Sample Request, Claim, Ticket** — NEVER match; always create new

## Seed Forms (13 total)

5 re-mapped from V1:

- f_trade_show → create_retailer_account (prospect)
- f_contact_us → create_retailer_account (prospect)
- f_rfq → create_quote
- f_account → create_credit_application
- f_feedback → log_activity

8 new in V2:

- f_sample_request → create_sample_request
- f_dealer_app → create_retailer_account (prospect, business_type=independent_retailer)
- f_tax_exempt → create_tax_exemption
- f_claim → create_claim
- f_standing_order → create_standing_order
- f_catalog → log_activity (catalog_drop_sent)
- f_vendor → create_vendor
- f_abr → log_activity (abr_meeting)

## Verification

After any change, run:

```bash
bun run tsc --noEmit && bun run build
```

Both must pass. If either fails, fix the errors before moving on.

For UI verification, run `bun run dev` and check:

1. Left panel renders 13 createable + 6 reference-only entity groups
2. Submission tab switches correctly between all 13 CRM actions
3. All 13 seed forms load without console errors
4. Workflow Manager palette shows Entity / Routing / Status sections
5. Retailer detail page loads at /retailers/:id
