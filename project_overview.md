# WizForms — Project Overview

**Audience:** Head of Product
**Module:** WizForms (Forms & Form Automations) within WizOrder / WizCommerce
**Status:** V2 migration substantially complete (catalog, store, builder UI, workflow manager, seed content). Prototype — front-end only, in-memory data.
**Last updated:** 2026-06-09

---

## 1. Executive Summary

WizForms is the **form-building and lead/order-capture module** of WizCommerce, a B2B wholesale commerce platform serving suppliers, distributors, and their retail buyers. It lets a wholesaler's team build branded forms (trade-show lead capture, RFQs, dealer applications, claims, sample requests, etc.), drop them anywhere (web, email, QR at a booth), and have each submission **flow directly into the right wholesale CRM record** with the right defaults, duplicate-matching, and downstream automation.

The defining change in **V2** is that WizForms stopped modeling the world with a generic CRM vocabulary (Lead, Deal, Contact, Company, Ticket) and adopted a **wholesale-native entity model** of 19 entities (Retailer Account, Buyer Contact, Quote, Order, Standing Order, Sample Request, Credit Application, Tax Exemption Certificate, Claim/RMA, Vendor, Trade Show, Ticket, Activity, plus 6 reference entities). Every form now creates a *real wholesale object*, not an abstract "lead."

The single most important conceptual shift:

> **There is no separate "Lead" entity.** A lead is simply a **Retailer Account** whose `opening_order_status = "prospect"`. There is no lead-to-customer "conversion" event — a prospect becomes active the moment it places an opening order. This collapses the artificial Lead→Customer funnel into one continuous account lifecycle, which is how wholesale actually works.

---

## 2. Who Uses It & Why

| Persona | Role | What they do in WizForms |
|---|---|---|
| **Sales Ops / Admin** | Configures the system | Builds forms, maps fields to entities, sets duplicate-matching rules, designs automation workflows, manages governance/permissions |
| **Sales Rep** | Field/booth user | Captures leads at trade shows, submits orders/quotes on behalf of retailers, gets auto-assigned and notified |
| **Sales Manager** | Oversight | Reviews high-value quotes, monitors form analytics, approves routing rules |
| **Retailer / Buyer** | External submitter | Fills out public-facing forms — dealer applications, RFQs, sample requests, claims, tax-exemption certs, catalog requests |
| **Finance / Credit** | Back office | Receives credit applications and tax-exemption certificates with the right fields for vetting |

The core promise to each: **the form captures structured, wholesale-correct data once, and it lands in the right place automatically** — no rekeying, no generic "lead" bucket that someone has to triage and re-categorize.

---

## 3. The Entity Model (the foundation)

Everything in WizForms flows from a single catalog of **19 entities / 290 properties**, defined in `src/lib/crm-catalog.ts`. This catalog is the **single source of truth** — every UI surface (field library, submission mapping, field config, workflow nodes) reads from it rather than hardcoding anything.

### 3.1 Createable entities (13) — forms can create these

| Entity | Properties | Sub-groups | What a form creates |
|---|---:|---|---|
| **Retailer Account** | 47 | Identity & Structure, Commerce State, Financial State, GTM, Logistics | The central account record — prospect through active customer |
| **Buyer Contact** | 17 | Personal, Role, Preferences, Association | A person at a retailer (owner, head buyer, AP contact…) |
| **Quote** | 25 | Header, Pricing, Shipping & Delivery, Status & Context | A priced proposal, expiring, convertible to an order |
| **Order** | 21 | Header, Routing, Delivery Preferences, Status | A purchase order with a 16-state fulfillment lifecycle |
| **Standing Order** | 14 | General | A recurring auto-order (weekly/seasonal) |
| **Sample Request** | 14 | General | A sample ship with follow-up / return tracking |
| **Credit Application** | 24 | Submission, Requested Terms, Identity & Financial, Trade References, Files, Decision | A financial vetting application |
| **Tax Exemption Certificate** | 10 | General | A resale/exemption cert tied to a state |
| **Claim / RMA** | 19 | Header, Claim Line Items | A damage/defect/shortage claim with line items |
| **Vendor** | 21 | General | A supplier onboarding record |
| **Trade Show** | 15 | General | A show with ROI tracking (leads, GMV, cost) |
| **Ticket** | 6 | General | A support/dispute ticket |
| **Activity** | 5 | General | A logged touchpoint (catalog drop, ABR meeting, survey) |

### 3.2 Reference-only entities (6) — lookup targets, never created by forms

Sales Rep (10), Rep Group (7), Price List (5), Payment Method (8), Store Location (11), SKU/Product (11). These appear in **lookup fields** (e.g. "Primary Rep → Sales Rep", "SKU → Product") as searchable selects, but a form never *creates* one — they're existing master data.

### 3.3 Why this matters to product

- **Wholesale concepts are first-class.** EIN, MAP compliance tier, MOQ, EOM terms, blind ship, resale cert, opening-order status, LTV/TTM/YTD GMV, exclusivity type, AR aging — these are real fields, not custom-field afterthoughts. Each carries `helpText` that explains the jargon in-product (e.g. *"EOM = End of Month — payment due by last day of the month following invoice"*).
- **Duplicate matching is entity-specific** and correct for wholesale (see §6).
- **The catalog scales without code.** Adding a property = one catalog entry; it instantly appears in the field library, mapping table, and config panel.

---

## 4. Architecture

### 4.1 Stack

- **React 19 + TypeScript (strict)**, Vite build, Bun runtime
- **TanStack Router** (file-based routing in `src/routes/`)
- **Radix UI + shadcn/ui** primitives, **Tailwind CSS v4**
- **@dnd-kit** for drag-and-drop (canvas, field reordering, option reordering)
- **Recharts** (analytics), **react-hook-form + zod**, **TanStack Query**
- **No backend.** All data is in-memory React state seeded from mock data. This is a product/UX prototype, not a production system.

### 4.2 Key files (the "spine")

| File | Responsibility |
|---|---|
| `src/lib/crm-catalog.ts` | **The foundation.** `EntityType`, `CrmAction`, `CrmPropertySeed`, `PROPERTY_GROUPS`, `CRM_PROPERTIES` (290 props), and helpers: `getPropertiesForEntity`, `getEntityLabel`, `getActionLabel`, `getDefaultMatchKeys`, `entityForAction`, `entityBadgeClasses`, `getLookupPlaceholders` |
| `src/lib/forms-store.tsx` | App state: `CRMConfig`, `RetailerAccount`, `FormField`/`Form` types, 13 seed forms, 2 seed workflows, seed retailers/submissions, and the legacy→V2 migration logic |
| `src/components/builder/` | The form builder — left panel (field library / properties), center canvas, right config panels |
| `src/components/builder/panels/FormSettingsTabs.tsx` | Right-panel tabs: **Submission** (the catalog-driven `EntityActionPanel`), Automation, Style, Settings |
| `src/components/builder/panels/FieldConfigPanel.tsx` | Per-field config (when a field is selected) |
| `src/routes/forms.*.tsx` | Dashboard, builder, preview, submissions, share, analytics |
| `src/routes/settings.workflow-manager.$workflowId.tsx` | Visual workflow builder |
| `src/routes/customers.$customerId.tsx` | Retailer detail page |

### 4.3 The central design principle: **catalog-driven UI**

No surface hardcodes per-entity rendering. There is **one** `EntityActionPanel` that handles all 13 CRM actions; **one** field library that renders all 19 entities; **one** field-mapping table. If an engineer ever writes `if (action === "create_quote") {…} else if (action === "create_order") {…}`, that's a bug — the catalog drives it. This is what keeps 19 entities maintainable and lets product add entities/fields without UI rewrites.

### 4.4 The form ⇄ CRM contract (`CRMConfig`)

Each form carries:

```ts
interface CRMConfig {
  action: CrmAction;                  // create_retailer_account | create_quote | … | log_activity | none
  fieldMap: Record<string, string>;   // entity property id → form field id ("Populate from")
  matchKeys: string[];                 // which properties define a duplicate
  matchFoundAction?: "link" | "link_update" | "ignore";
  defaults: Record<string, string|boolean>;  // values pre-set on the created record
  parentEntityRef?: { entity; idField };      // for child records (e.g. a Quote under a Retailer)
}
```

This is the heart of the product: a form is a **mapping from public input → a structured wholesale record**, plus the rules for what to do if that record might already exist.

---

## 5. The User Experience, Surface by Surface

### 5.1 Forms Dashboard (`/forms`)
A sortable, filterable table of all forms: Name, Status (Draft/Published/Archived), Type, **CRM Action** (shows the human label — e.g. "Create Retailer Account", "Create Quote", "Log Activity"), Submissions (30d), Created, Last Updated. This is where a user sees at a glance *what each form does to the CRM*.

### 5.2 The Builder (`/forms/builder/:id`)
Three-panel layout:

**Left panel** — two tabs:
- **Fields** — the property library, grouped **Createable entities (13)** at top and **Reference-only entities (6)** in a dimmer collapsible section below. Each entity expands into sub-group accordions; every property is **draggable onto the canvas**. Commonly-used properties are starred; properties with wholesale jargon show an **ℹ️ tooltip**. A **Kai (AI) suggestion banner** surfaces one context-aware recommendation at a time (see §7).
- **Properties** — browse the full catalog + **Create Property** (custom fields, scoped to an entity + sub-group).

**Center canvas** — drag-and-drop form layout: sections, rows, multi-column fields (full/half/third width), rich text, dividers, images, headings. Each field card shows its type badge, conditional-logic badges, and — for lookups — a **🔗 Lookup → [Entity]** badge.

**Right panel** — context-sensitive:
- When a **field** is selected: `FieldConfigPanel` — display name, type (incl. **Lookup**, with a Lookup-Entity selector), placeholder, validation, options, visibility/required conditional logic. A blue badge shows **"Linked to [Entity] → [Property]"** with an ℹ️ for the property's helpText.
- When **no field** is selected: the four form-level tabs.

### 5.3 The Submission Tab — `EntityActionPanel` (the product's crown jewel)
One generic, catalog-driven panel for all 13 actions:
1. **Action selector** — pick what the form creates (or "none").
2. **Record Matching** — only shown for entities that *can* match (Retailer, Buyer, Vendor, Standing Order, Credit App, Tax Exemption). Checkboxes for each match key + "When a match is found: Link / Link & update / Ignore (always create new)." Auto-hidden for always-create entities (Quote, Order, Sample, Claim, Ticket).
3. **Defaults** — auto-generated from the entity's select/checkbox properties. E.g. a "Create Retailer Account" form exposes Default Opening-Order Status, Business Type, How Did You Hear; a "Create Quote" form exposes Default Source and Urgency.
4. **Field Mapping table** — every entity property in one column; a "Populate from" dropdown of canvas fields in the other. Starred commonly-used props, lookup badges, helpText ℹ️ icons.

### 5.4 Automation Tab
Quick toggles: send follow-up email (template), notify team/roles/assigned rep, create task (title/assignee/due/priority), Kai duplicate detection. Link out to the full **Workflow Manager** for advanced logic.

### 5.5 Style & Settings Tabs
Style: brand colors, fonts, radii, submit-button text. Settings: name/description/status/type, multi-step toggle, **governance** (role-based create/view/edit/delete permissions for Admin / Sales Manager / Sales Rep), CAPTCHA, GDPR consent footer.

### 5.6 Live Preview (`/forms/preview/:id`)
Renders the real, fillable form with validation and conditional logic. **Lookup fields render as populated selects** with realistic placeholder data (e.g. SKU → "SKU-001 — Modern Pendant"). Includes a mock **duplicate-detection** panel showing matched Retailer records (Active / Prospect).

### 5.7 Workflow Manager (`/settings/workflow-manager/:id`)
A visual node-graph automation builder. Palette in three sections:
- **Entity Creation** (12 nodes — one per createable action, each with its own icon)
- **Routing / Assignment** (Assign Sales Rep, Send Notification, Create Task, Branch on Condition)
- **Status Changes** (Set Retailer/Quote/Order Status — each with catalog-driven status dropdowns — and Convert Quote → Order)

Drag nodes onto a canvas, connect them, branch on TRUE/FALSE conditions. Each node shows its entity icon and a one-line config summary. Forms deep-link here ("Advanced automation →").

### 5.8 Retailer Detail (`/customers/:id` → "Retailer")
A retailer account record with identity, terms, rep, pricelist, and tabs (Sales, Orders, Activity, Notes, Form Submissions) showing every form submission associated with that account.

---

## 6. Duplicate-Matching Rules (business-critical)

`getDefaultMatchKeys()` encodes how wholesale identifies a duplicate per entity. These are deliberate and must not drift:

| Entity | Matches on | Rationale |
|---|---|---|
| Retailer Account | EIN, Legal Name | EIN is the legal identity; legal name is the fallback |
| Buyer Contact | Email, Phone | A person is their contact details |
| Vendor | EIN | Legal supplier identity |
| Standing Order | Retailer + Name | A named recurring order per account |
| Credit Application | EIN + Status | One open application per business |
| Tax Exemption | Retailer + State | Certs are per-state |
| **Quote, Order, Sample Request, Claim, Ticket** | **(never match — always create new)** | These are transactional events; each submission is genuinely new |

This prevents the two classic wholesale data problems: (a) duplicate retailer accounts fragmenting a buyer's history/credit, and (b) transactional records being wrongly merged.

---

## 7. Kai — the embedded AI assistant

Kai surfaces **one wholesale-relevant suggestion at a time** in the builder, dismissable, rotating to the next applicable tip. Current rule set (intentionally domain-specific):

- Retailer form with legal name + EIN but no payment terms → *"Add Payment Terms and Credit Limit to capture financial qualification upfront."*
- Any order properties but no delivery window → *"Add Delivery Preferences — retailers often need lift-gate, appointment scheduling, or white-glove delivery."*
- Create-Quote form with no expiry date → *"Add Quote Expiry Date — un-expiring quotes are a common source of pricing disputes."*
- Any retailer property but no primary rep → *"Add Primary Rep assignment so submissions are auto-routed."*
- Create-Credit-Application with no trade references → *"Add 2–3 Trade References — standard for credit vetting."*
- Specialty account (interior designer / hospitality) → *"Add Minimum Annual Commitment and Exclusivity Type for specialty accounts."*
- Create-Claim with no line items → *"Add Claim Line Items so buyers can specify each affected SKU with photos."*

Kai also runs (mock) duplicate detection on submit. The intent: encode wholesale best practices so even a non-expert builds a *correct* form.

---

## 8. End-to-End Use Cases

### UC-1 — Trade-show lead capture (the flagship flow)
A rep at Atlanta Market opens the **Trade Show Lead Capture** form on a tablet. A buyer fills it in. On submit:
- Creates a **Retailer Account** with `opening_order_status = prospect`, `how_did_you_hear = trade_show`.
- Matches on EIN/Legal Name to avoid duplicating an existing account.
- The **"Trade Show Lead Routing"** workflow fires: *if EIN provided* → create the full Retailer Account → assign a rep (round-robin) → notify the rep; *else* → create just a Buyer Contact → assign a rep.

This is the "no more shoeboxes of business cards" story — structured accounts, auto-routed, deduplicated, the moment the badge is scanned.

### UC-2 — RFQ → Quote with value-based routing
A buyer submits the **Request for Quote** form. On submit it creates a **Quote** (`source = rfq`). The **"RFQ → Quote Routing"** workflow branches on `grand_total > $50,000`: high-value quotes go to a senior rep with a "Review high-value quote" task and a manager notification; smaller quotes go round-robin. Quotes carry an **expiry date** (Kai nudges for it) to prevent stale-pricing disputes.

### UC-3 — Dealer / Reseller application (prospect onboarding)
A prospective retailer completes the multi-step **Dealer / Reseller Application** (business info, territory & commitment, contact). Creates a Retailer Account defaulted to `prospect` + `business_type = independent_retailer`, matched on EIN/Legal Name, routed to a rep for review. No separate "lead" object to later "convert" — it's already the account.

### UC-4 — Credit application (finance vetting)
The **New Account Application** creates a **Credit Application** with requested terms, EIN, bank details, and a repeatable **Trade References** block — exactly what finance needs to vet terms. Kai enforces the trade-reference best practice.

### UC-5 — Sample request with follow-up loop
The **Sample Request** form (SKU lookup, qty, purpose, willing-to-pay, return-due-date) creates a Sample Request defaulted to `requested`, always creating new (samples are transactional), and triggers a "ship sample & schedule follow-up" task — closing the loop that usually leaks revenue.

### UC-6 — Claim / RMA intake
The **Claim / RMA** form captures claim type, source order (lookup), preferred resolution, and a repeatable **claim line items** block (SKU + qty + issue + photo). Always creates new; routes to support. Buyers self-serve structured claims instead of emailing photos around.

### UC-7 — Standing order setup (recurring revenue)
The **Standing Order Setup** form captures schedule (frequency, seasonal months shown conditionally), product lines (SKU lookup + qty), and payment/shipping. Defaults to `active` + `review_before_shipping`. Matched on Retailer + Name.

### UC-8 — Vendor onboarding, tax exemption, catalog requests, ABR
Supporting flows: **Vendor Onboarding** (W-9, insurance, compliance certs, terms → Vendor, matched on EIN), **Tax Exemption Certificate** (per-state cert → status pending), **Catalog Request** and **Annual Business Review Intake** (both log Activities — `catalog_drop_sent`, `abr_meeting`).

---

## 9. Current State & What's Seeded

- **13 seed forms** — 5 re-mapped from V1 (Trade Show, Contact Us, RFQ, New Account App, Post-Purchase Feedback) + 8 new (Sample Request, Dealer App, Tax Exemption, Claim/RMA, Standing Order, Catalog Request, Vendor Onboarding, ABR Intake). All Published except ABR (Draft); all 0 submissions, ready to demo.
- **2 seed workflows** — Trade Show Lead Routing, RFQ → Quote Routing.
- **3 seed retailers** + sample submissions (2 active, 1 prospect).
- **Legacy migration** — any old V1 form (lead/deal/lead_deal/ticket actions) is auto-converted on load: lead/lead_deal → `create_retailer_account` with `prospect` default; old field maps discarded with a `console.warn`. Idempotent (V2 configs pass through untouched).
- **Terminology swept** — no "Lead/Deal/Customer" in user-facing UI; navigation reads "Retailers" and "Prospects," detail pages say "Retailer," dedup panels show Retailer · Active/Prospect.
- **Build health** — `tsc` and `bun run build` are green. (One pre-existing `vite.config.ts` typing quirk for the `vercel` key is unrelated and doesn't affect the build.)

---

## 10. Known Gaps & Recommended Roadmap

| Area | Gap | Recommendation |
|---|---|---|
| **Repeatable blocks** | Trade References & Claim Line Items are modeled as plain field groups with a helpText convention — no true "add another" UI. | Add a first-class repeatable-group field type. High value for claims/credit/standing-orders. |
| **Backend** | Everything is in-memory mock data. | Wire to real CRM APIs; the `CRMConfig` contract is designed for this. |
| **Submission processing** | `fieldMap` is captured (property → form field) but nothing consumes it yet to actually write records. | Build the submission → entity-record pipeline reading `fieldMap`, `defaults`, `matchKeys`. |
| **Route naming** | The retailer detail route is still `/customers/:id` internally (label says "Retailer"). | Rename route to `/retailers/:id` for consistency. |
| **Lookup data** | Lookup fields use placeholder data. | Connect to real Sales Rep / SKU / Price List master data. |
| **Kai** | Rule-based suggestions + mock dedup. | Connect to a real model for field suggestions, dedup scoring, and form generation from a prompt. |
| **Workflow execution** | Visual builder only; nodes don't execute. | Build the workflow runtime; the node `kind` + config schema is ready. |

---

## 11. One-Paragraph Pitch for Leadership

WizForms turns every wholesale touchpoint — a booth badge scan, an RFQ, a dealer application, a damage claim, a recurring-order setup — into a **structured, deduplicated, correctly-routed wholesale record**, with zero rekeying. By replacing generic CRM abstractions with a 19-entity wholesale-native model and a catalog that drives the entire UI, it lets sales ops stand up domain-correct forms in minutes, embeds wholesale best practices via the Kai assistant, and routes every submission through visual automation workflows. The architecture is deliberately catalog-driven so the product scales to new entities and fields without UI rewrites — the foundation for a best-in-class B2B capture-to-CRM experience.
