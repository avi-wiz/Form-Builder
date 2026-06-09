// Kai "operator" actions — Kai does, the user confirms. Centralizes the logic
// behind the smart-setup banner, the post-trade-show bulk flow, and the
// apply-able contextual suggestions. All operate on the in-memory store.
import {
  getSectionFields,
  type StoreCtx, type Form, type FormField, type AutomationConfig,
} from "./forms-store";
import {
  CRM_PROPERTIES, getActionLabel, getDefaultMatchKeys, getDefaultMatchFoundAction,
  getMatchingSummary, suggestFieldMapping, entityForAction,
  type CrmAction, type CrmPropertySeed,
} from "./crm-catalog";

function rid(prefix: string): string {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function includedFields(form: Form): FormField[] {
  return form.sections.flatMap((s) => getSectionFields(s).filter((f) => f.included && f.type !== "hidden"));
}

// ── Recommended automation per action (shared with the Automation tab) ────────
export function getRecommendation(action: CrmAction): { text: string; apply: Partial<AutomationConfig> } | null {
  switch (action) {
    case "create_retailer_account":
      return {
        text: "Notify the assigned rep + Send a welcome email + Create a 'Follow up' task in 7 days.",
        apply: { notifyRep: true, sendEmail: true, emailTemplate: "Account Application Received", createTask: true, taskTitle: "Follow up", taskDue: "+1 week", taskPriority: "Medium" },
      };
    case "create_quote":
      return {
        text: "Notify the assigned rep + Send the quote to the buyer + Create a 'Quote sent' touchpoint.",
        apply: { notifyRep: true, sendEmail: true, emailTemplate: "RFQ Received", createTask: true, taskTitle: "Quote sent", taskDue: "+1 day", taskPriority: "Medium" },
      };
    case "create_order":
      return {
        text: "Notify the assigned rep + Send order confirmation + Notify fulfillment.",
        apply: { notifyRep: true, sendEmail: true, emailTemplate: "General Acknowledgement", notifyTeam: true, notifyTargets: ["Admin"] },
      };
    case "create_claim":
      return {
        text: "Notify the assigned rep + Acknowledge to buyer + Create a 'Review claim' task within 24h.",
        apply: { notifyRep: true, sendEmail: true, emailTemplate: "General Acknowledgement", createTask: true, taskTitle: "Review claim", taskDue: "+1 day", taskPriority: "High" },
      };
    default:
      return null;
  }
}

// ── Behavior 1: smart-setup ───────────────────────────────────────────────────
export interface SetupSummary {
  actionLabel: string;
  defaultsText: string;
  matchSummary: string;
  mappedCount: number;
  automationText: string | null;
}

export function setupFormDefaults(store: StoreCtx, form: Form): SetupSummary {
  const action = form.crm.action;
  const entity = entityForAction(action);

  // 1. Sensible starter defaults (don't clobber existing ones).
  const defaults: Record<string, string | boolean> = { ...form.crm.defaults };
  if (action === "create_retailer_account" && Object.keys(defaults).length === 0) {
    defaults.opening_order_status = "prospect";
  }

  // 2. Duplicate matching from the catalog.
  const matchKeys = getDefaultMatchKeys(action);
  const matchFoundAction = getDefaultMatchFoundAction(action);

  // 3. Auto-map obvious fields → entity properties.
  const fieldMap: Record<string, string> = { ...form.crm.fieldMap };
  let mappedCount = 0;
  if (entity) {
    const mappedFieldIds = new Set(Object.values(fieldMap));
    for (const f of includedFields(form)) {
      if (mappedFieldIds.has(f.id)) continue;
      const sug = suggestFieldMapping(f.displayName, entity);
      if (!sug || fieldMap[sug.propertyId]) continue;
      fieldMap[sug.propertyId] = f.id;
      mappedFieldIds.add(f.id);
      mappedCount++;
    }
  }

  // 4. Recommended automation preset.
  const rec = getRecommendation(action);
  let automation = form.automation;
  if (rec) {
    automation = { ...form.automation, ...rec.apply };
    if (rec.apply.notifyTargets) {
      automation.notifyTargets = Array.from(new Set([...form.automation.notifyTargets, ...rec.apply.notifyTargets]));
    }
  }

  store.updateForm(form.id, {
    crm: { ...form.crm, matchKeys, matchFoundAction, defaults, fieldMap },
    automation,
  });

  const defaultsText = Object.entries(defaults).map(([k, v]) => `${k}=${v}`).join(", ");
  return {
    actionLabel: getActionLabel(action),
    defaultsText,
    matchSummary: getMatchingSummary(action, matchFoundAction),
    mappedCount,
    automationText: rec?.text ?? null,
  };
}

// Snapshot/restore for the banner's "Undo all".
export interface FormSnapshot {
  crm: Form["crm"];
  automation: Form["automation"];
  sections: Form["sections"];
}
export function snapshotForm(form: Form): FormSnapshot {
  return JSON.parse(JSON.stringify({ crm: form.crm, automation: form.automation, sections: form.sections }));
}
export function restoreForm(store: StoreCtx, formId: string, snap: FormSnapshot): void {
  store.updateForm(formId, { crm: snap.crm, automation: snap.automation, sections: snap.sections });
}

// ── Behavior 2: post-trade-show bulk flow ─────────────────────────────────────
export interface BulkOptions {
  logTouchpoint?: boolean;
  draftEmail?: boolean;
  createTask?: boolean;
  flagHighValue?: boolean;
}

export interface BulkResult { touchpoints: number; emails: number; tasks: number; flagged: number }

export function bulkPostTradeShowFlow(store: StoreCtx, formId: string, opts: BulkOptions = {}, mockCount?: number): BulkResult {
  const o = { logTouchpoint: true, draftEmail: true, createTask: true, flagHighValue: true, ...opts };
  const subs = store.submissions.filter((s) => s.formId === formId);
  const retailerIds = Array.from(new Set(subs.map((s) => s.associatedRecord).filter((x): x is string => !!x)));
  const now = new Date().toISOString();

  if (o.logTouchpoint) {
    for (const retailerId of retailerIds) {
      store.addTouchpoint({
        id: rid("T_"), retailerId, type: "meeting",
        notes: "Show booth conversation — captured at trade show.",
        date: now.slice(0, 10), createdAt: now, loggedBy: "Kai (bulk)",
      });
    }
  }

  // Emails (mock outbox) and tasks (mock) have no store yet — report the counts.
  // Use the mock detection count so the demo numbers match the prompt.
  const n = mockCount ?? retailerIds.length;
  return {
    touchpoints: o.logTouchpoint ? n : 0,
    emails: o.draftEmail ? n : 0,
    tasks: o.createTask ? n : 0,
    flagged: o.flagHighValue ? Math.max(0, Math.round(n * 0.1)) : 0,
  };
}

// Mock high-volume detection: real window logic first, demo fallback second so
// the proactive pattern is always visible with the seed data.
export interface HighVolume { formId: string; formName: string; count: number }
export function detectHighVolume(store: StoreCtx): HighVolume | null {
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const counts = new Map<string, number>();
  for (const s of store.submissions) {
    if (new Date(s.submittedAt).getTime() >= cutoff) {
      counts.set(s.formId, (counts.get(s.formId) ?? 0) + 1);
    }
  }
  for (const [formId, count] of counts) {
    if (count > 10) {
      const name = store.forms.find((f) => f.id === formId)?.name ?? "a form";
      return { formId, formName: name, count };
    }
  }
  // Demo fallback — pretend the trade-show form just captured a burst.
  const demo = store.forms.find((f) => f.id === "f_trade_show");
  if (demo) return { formId: demo.id, formName: demo.name, count: 47 };
  return null;
}

// ── Behavior 3: apply-able contextual suggestions ─────────────────────────────
export interface KaiSuggestion { id: string; text: string; applyLabel: string; impact: number }

type AddSpec = { id: string; suffix?: string };
interface SuggestionSpec {
  id: string;
  impact: number;          // higher = shown first
  text: string;
  applyLabel: string;
  addProps: AddSpec[];
  when: (ctx: { action: CrmAction; has: (id: string) => boolean; hasAnyOf: (p: string) => boolean; hasBusinessType: boolean }) => boolean;
}

const tradeRefBlock: AddSpec[] = [1, 2, 3].flatMap((n) => [
  { id: "credit_application.trade_ref_company", suffix: `#${n}` },
  { id: "credit_application.trade_ref_contact", suffix: `#${n}` },
  { id: "credit_application.trade_ref_phone", suffix: `#${n}` },
  { id: "credit_application.trade_ref_email", suffix: `#${n}` },
]);

const SUGGESTION_SPECS: SuggestionSpec[] = [
  {
    id: "fin-qual", impact: 90,
    text: "Add Payment Terms and Credit Limit to capture financial qualification upfront.",
    applyLabel: "Apply (adds both fields)",
    addProps: [{ id: "retailer.payment_terms" }, { id: "retailer.credit_limit" }],
    when: ({ has }) => has("retailer.legal_name") && has("retailer.ein") && !has("retailer.payment_terms"),
  },
  {
    id: "trade-refs", impact: 85,
    text: "Add 2–3 Trade References — standard for credit vetting.",
    applyLabel: "Apply (adds 3 trade reference blocks)",
    addProps: tradeRefBlock,
    when: ({ action, hasAnyOf }) => action === "create_credit_application" && !hasAnyOf("credit_application.trade_ref_"),
  },
  {
    id: "quote-expiry", impact: 80,
    text: "Add Quote Expiry Date — un-expiring quotes are a common source of pricing disputes.",
    applyLabel: "Apply (adds expiry_date, 14-day default)",
    addProps: [{ id: "quote.expiry_date" }],
    when: ({ action, has }) => action === "create_quote" && !has("quote.expiry_date"),
  },
  {
    id: "claim-lines", impact: 75,
    text: "Add Claim Line Items so buyers can specify each affected SKU with photos.",
    applyLabel: "Apply (adds claim line fields)",
    addProps: [
      { id: "claim.claim_line_sku" }, { id: "claim.claim_line_qty_affected" },
      { id: "claim.claim_line_issue_description" }, { id: "claim.claim_line_photo_evidence" },
    ],
    when: ({ action, hasAnyOf }) => action === "create_claim" && !hasAnyOf("claim.claim_line_"),
  },
  {
    id: "delivery", impact: 60,
    text: "Add Delivery Preferences — retailers often need lift-gate, appointment scheduling, or white-glove delivery.",
    applyLabel: "Apply (adds delivery fields)",
    addProps: [{ id: "order.delivery_window" }, { id: "order.special_requirements" }, { id: "order.delivery_notes" }],
    when: ({ hasAnyOf, has }) => hasAnyOf("order.") && !has("order.delivery_window"),
  },
  {
    id: "primary-rep", impact: 55,
    text: "Add Primary Rep assignment so submissions are auto-routed.",
    applyLabel: "Apply (adds Primary Rep field)",
    addProps: [{ id: "retailer.primary_rep" }],
    when: ({ hasAnyOf, has }) => hasAnyOf("retailer.") && !has("retailer.primary_rep"),
  },
  {
    id: "specialty", impact: 40,
    text: "Add Minimum Annual Commitment and Exclusivity Type for specialty accounts.",
    applyLabel: "Apply (adds both fields)",
    addProps: [{ id: "retailer.minimum_annual_commitment" }, { id: "retailer.exclusivity_type" }],
    when: ({ hasBusinessType, has }) => hasBusinessType && (!has("retailer.minimum_annual_commitment") || !has("retailer.exclusivity_type")),
  },
];

function usedPropertyIds(form: Form): Set<string> {
  const ids = new Set<string>();
  for (const s of form.sections) for (const f of getSectionFields(s)) if (f.propertyId) ids.add(f.propertyId);
  return ids;
}

export function computeSuggestions(form: Form): KaiSuggestion[] {
  const used = usedPropertyIds(form);
  const has = (id: string) => used.has(id);
  const hasAnyOf = (p: string) => [...used].some((id) => id.startsWith(p));
  const hasBusinessType =
    [...used].includes("retailer.business_type") ||
    !!form.crm.defaults["retailer.business_type"] ||
    form.sections.some((s) => getSectionFields(s).some((f) => f.type === "select" && /business type/i.test(f.displayName)));
  const ctx = { action: form.crm.action, has, hasAnyOf, hasBusinessType };
  return SUGGESTION_SPECS
    .filter((s) => s.when(ctx))
    .sort((a, b) => b.impact - a.impact)
    .map(({ id, text, applyLabel, impact }) => ({ id, text, applyLabel, impact }));
}

function buildField(prop: CrmPropertySeed, suffix?: string): FormField {
  return {
    id: rid("f_"),
    displayName: suffix ? `${prop.label} ${suffix}` : prop.label,
    type: prop.defaultFieldType,
    required: false,
    included: true,
    propertyId: prop.id,
    ...(prop.options ? { options: prop.options } : {}),
    ...(prop.lookupEntity ? { lookupEntity: prop.lookupEntity } : {}),
  };
}

// Applies a suggestion by adding its fields to the form. Returns a toast message.
export function applySuggestion(store: StoreCtx, form: Form, suggestionId: string): string {
  const spec = SUGGESTION_SPECS.find((s) => s.id === suggestionId);
  if (!spec) return "Nothing to apply.";
  const sectionId = form.sections[0]?.id;
  if (!sectionId) return "Add a section first.";
  for (const add of spec.addProps) {
    const prop = CRM_PROPERTIES.find((p) => p.id === add.id);
    if (!prop) continue;
    store.addField(form.id, sectionId, buildField(prop, add.suffix));
  }
  const count = spec.addProps.length;
  return `Added ${count} field${count === 1 ? "" : "s"}.`;
}
