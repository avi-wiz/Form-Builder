import { createContext, useContext, useState, type ReactNode } from "react";
import type { CrmPropertySeed, CrmAction, EntityType } from "./crm-catalog";
import { getDefaultMatchKeys, CRM_PROPERTIES } from "./crm-catalog";
export type { CrmPropertySeed };

export type FieldType =
  | "text" | "long_text" | "percentage" | "select" | "multi_select" | "url"
  | "html" | "email" | "number" | "phone" | "checkbox" | "date" | "file"
  | "currency" | "hidden" | "radio" | "rating" | "consent" | "lookup";

export interface FieldOption { label: string; value: string }

export type ConditionOperator = "equals" | "not_equals" | "contains" | "is_blank" | "greater_than" | "less_than";
export interface VisibilityRule { fieldId: string; operator: ConditionOperator; value: string }
export interface VisibilityConditions { logic: "AND" | "OR"; rules: VisibilityRule[] }

export type FieldWidth = "full" | "half" | "third";

export interface FormField {
  id: string;
  displayName: string;
  type: FieldType;
  required: boolean;
  included: boolean;
  placeholder?: string;
  helpText?: string;
  options?: FieldOption[];
  defaultValue?: string;
  ratingScale?: 5 | 10;
  consentText?: string;
  privacyUrl?: string;
  captureFromUrl?: boolean;
  urlParamName?: string;
  budgetMin?: string;
  budgetMax?: string;
  conditions?: VisibilityConditions;
  requiredWhen?: VisibilityConditions;
  width?: FieldWidth;
  allowOther?: boolean;
  propertyId?: string;
  lookupEntity?: EntityType;
  minLength?: number;
  maxLength?: number;
  validationPattern?: string;
  validationMessage?: string;
}

export type RowKind = "fields" | "richText" | "divider" | "image" | "heading";

export interface FormRow {
  id: string;
  kind: RowKind;
  fields?: FormField[];
  richText?: { html: string };
  image?: { src: string; alt?: string; align?: "left" | "center" | "right" };
  heading?: { text: string; level: 2 | 3 };
}

export interface FormSection {
  id: string;
  name: string;
  quickAdd: boolean;
  show: boolean;
  rows: FormRow[];
  description?: string;
  // Legacy field kept for migration only; runtime code should use rows + getSectionFields
  fields?: FormField[];
}

export type FormStatus = "draft" | "published" | "archived";
export type FormKind = "Lead Capture" | "Contact" | "RFQ" | "Custom";

export interface AfterSubmission {
  mode: "message" | "redirect" | "both";
  message: string;
  redirectUrl: string;
  delay: number;
}
export interface CRMConfig {
  action: CrmAction;
  fieldMap: Record<string, string>;
  matchKeys: string[];
  matchFoundAction?: "link" | "link_update" | "ignore";
  defaults: Record<string, string | boolean>;
  parentEntityRef?: { entity: EntityType; idField: string };
}
export interface AutomationConfig {
  sendEmail: boolean;
  emailTemplate: string;
  notifyTeam: boolean;
  notifyTargets: string[];
  notifyRep?: boolean;
  createTask: boolean;
  taskTitle: string;
  taskAssignee: string;
  taskDue: string;
  taskPriority: string;
  kaiDedup?: boolean;
}

export type EmbedTheme = "light" | "dark" | "auto";

export interface FormStyle {
  primaryColor: string;
  buttonColor: string;
  fontFamily: "Inter" | "Roboto" | "Open Sans" | "System";
  fieldRadius: number;
  buttonRadius: number;
  submitText: string;
}

export const DEFAULT_FORM_STYLE: FormStyle = {
  primaryColor: "#16A34A",
  buttonColor: "#16A34A",
  fontFamily: "Inter",
  fieldRadius: 6,
  buttonRadius: 6,
  submitText: "Submit",
};

export type RoleName = "Admin" | "Sales Manager" | "Sales Rep";
export interface RolePermissions { create: boolean; view: boolean; edit: boolean; delete: boolean }
export interface FormGovernance {
  permissions: Record<RoleName, RolePermissions>;
  captchaEnabled: boolean;
  captchaVersion: "v3" | "v2";
  gdprConsent: boolean;
  gdprText: string;
}

export const DEFAULT_GOVERNANCE: FormGovernance = {
  permissions: {
    "Admin":         { create: true,  view: true,  edit: true,  delete: true  },
    "Sales Manager": { create: true,  view: true,  edit: true,  delete: false },
    "Sales Rep":     { create: true,  view: true,  edit: false, delete: false },
  },
  captchaEnabled: false,
  captchaVersion: "v3",
  gdprConsent: false,
  gdprText: "By submitting this form, you agree to our privacy policy and consent to being contacted in accordance with GDPR.",
};

export interface Form {
  id: string;
  name: string;
  slug: string;
  description: string;
  status: FormStatus;
  kind: FormKind;
  createdAt: string;
  updatedAt: string;
  sections: FormSection[];
  multiStep: boolean;
  embedTheme?: EmbedTheme;
  style?: FormStyle;
  governance?: FormGovernance;
  afterSubmit: AfterSubmission;
  crm: CRMConfig;
  automation: AutomationConfig;
  submissionCount: number;
  viewCount: number;
}

export interface Submission {
  id: string;
  formId: string;
  submitterName: string;
  submitterEmail: string;
  status: "new" | "reviewed" | "actioned";
  submittedAt: string;
  values: Record<string, string>;
  associatedRecord?: string;
}

export interface RetailerAccount {
  id: string;
  legal_name: string;
  dba?: string;
  ein?: string;
  email?: string;
  opening_order_status: "prospect" | "opened" | "active" | "dormant_90d" | "dormant_180d" | "lost" | "reactivated";
  payment_terms?: "COD" | "CIA" | "Net15" | "Net30" | "Net45" | "Net60" | "EOM";
  credit_limit?: number;
  primary_rep?: string;
  rep_group?: string;
  territory_assigned?: string;
  pricelist?: string;
  store_count?: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

export function getSectionFields(section: FormSection): FormField[] {
  if (!section.rows) return section.fields ?? [];
  const out: FormField[] = [];
  for (const r of section.rows) {
    if (r.kind === "fields" && r.fields) out.push(...r.fields);
  }
  return out;
}

function migrateSection(s: FormSection): FormSection {
  if (s.rows && s.rows.length > 0) {
    const { fields: _legacy, ...rest } = s;
    void _legacy;
    return { ...rest, rows: s.rows };
  }
  const fields = s.fields ?? [];
  const rows: FormRow[] = fields.map((f) => ({
    id: uid(),
    kind: "fields",
    fields: [{ ...f, width: f.width ?? "full" }],
  }));
  const { fields: _legacy, ...rest } = s;
  void _legacy;
  return { ...rest, rows };
}

// Maps V1 CRM action strings to V2 wholesale-native actions.
const ACTION_MIGRATION: Record<string, CrmAction> = {
  "lead": "create_retailer_account",
  "deal": "create_order",
  "lead_deal": "create_order",
  "ticket": "create_ticket",
  "none": "none",
};

const V2_ACTIONS = new Set<CrmAction>([
  "none", "create_retailer_account", "create_buyer_contact", "create_quote",
  "create_order", "create_credit_application", "create_claim",
  "create_ticket", "log_activity",
]);

// Collected across all migrateForm calls in a tick; warned once.
const migratedFormIds: string[] = [];

function migrateCrm(formId: string, crm: CRMConfig): CRMConfig {
  // Already a V2 config — pass through unchanged (idempotent).
  if (V2_ACTIONS.has(crm.action) && Array.isArray(crm.matchKeys) && crm.defaults) {
    return crm;
  }
  // Legacy V1 config: map the action, discard the old fieldMap, derive match keys.
  const legacyAction = String((crm as { action: string }).action);
  const newAction = ACTION_MIGRATION[legacyAction] ?? "none";
  const defaults: Record<string, string | boolean> =
    legacyAction === "lead" || legacyAction === "lead_deal"
      ? { opening_order_status: "prospect" }
      : {};
  migratedFormIds.push(formId);
  return {
    action: newAction,
    fieldMap: {},
    matchKeys: getDefaultMatchKeys(newAction),
    matchFoundAction: crm.matchFoundAction,
    defaults,
  };
}

function migrateForm(f: Form): Form {
  const migrated = { ...f, sections: f.sections.map(migrateSection), crm: migrateCrm(f.id, f.crm) };
  if (migratedFormIds.length > 0 && typeof console !== "undefined") {
    console.warn(
      `[WizForms migration] Migrated legacy CRM config (old fieldMap discarded) for forms: ${migratedFormIds.join(", ")}`,
    );
    migratedFormIds.length = 0;
  }
  return migrated;
}

function defaultBasicDetails(): FormSection {
  const mk = (field: FormField): FormRow => ({ id: uid(), kind: "fields", fields: [{ ...field, width: "full" }] });
  return {
    id: uid(), name: "Company Info", quickAdd: true, show: true,
    rows: [
      mk({ id: uid(), displayName: "Company name", type: "text", required: true, included: true, placeholder: "Acme Co.", propertyId: "company.name" }),
      mk({ id: uid(), displayName: "Display name", type: "text", required: false, included: true, propertyId: "company.display_name" }),
      mk({ id: uid(), displayName: "Email ID", type: "email", required: true, included: true, placeholder: "name@company.com", propertyId: "contact.email" }),
      mk({ id: uid(), displayName: "Phone", type: "phone", required: false, included: true, propertyId: "contact.phone" }),
    ],
  };
}

// Legacy helper used by seed code below — keeps the old shape and lets migrateForm convert it.
function legacySection(name: string, quickAdd: boolean, show: boolean, fields: FormField[]): FormSection {
  return { id: uid(), name, quickAdd, show, rows: [], fields };
}

// ── V2 seed-form helpers ────────────────────────────────────────────────────
// pf() builds a form field linked to a catalog property — label, type, options
// and lookupEntity are pulled straight from the catalog so IDs stay valid.
function pf(propertyId: string, overrides: Partial<FormField> = {}): FormField {
  const prop = CRM_PROPERTIES.find((p) => p.id === propertyId);
  if (!prop) {
    // Surface bad IDs loudly during dev rather than shipping a dangling link.
    if (typeof console !== "undefined") console.warn(`[seed] unknown property id: ${propertyId}`);
  }
  return {
    id: uid(),
    displayName: prop?.label ?? propertyId,
    type: prop?.defaultFieldType ?? "text",
    required: false,
    included: true,
    propertyId,
    ...(prop?.options ? { options: prop.options } : {}),
    ...(prop?.lookupEntity ? { lookupEntity: prop.lookupEntity } : {}),
    ...overrides,
  };
}

// ff() builds a free-standing field with no catalog link (e.g. an "Additional
// notes" box where no matching catalog property exists).
function ff(displayName: string, type: FieldType, overrides: Partial<FormField> = {}): FormField {
  return { id: uid(), displayName, type, required: false, included: true, ...overrides };
}

// A row-based section: each field becomes its own full-width row.
function seedSection(name: string, fields: FormField[], opts: { quickAdd?: boolean } = {}): FormSection {
  return {
    id: uid(), name, quickAdd: opts.quickAdd ?? false, show: true,
    rows: fields.map((f) => ({ id: uid(), kind: "fields", fields: [{ ...f, width: "full" }] })),
  };
}

function leadCaptureForm(): Form {
  return {
    id: "f_trade_show", name: "Trade Show Lead Capture", slug: "trade-show",
    description: "Capture leads at trade shows in seconds.",
    status: "published", kind: "Lead Capture",
    createdAt: "2026-04-10", updatedAt: "2026-05-30",
    multiStep: false,
    sections: [
      defaultBasicDetails(),
      legacySection("Trade Show Details", false, true, [
        { id: uid(), displayName: "Trade Show", type: "select", required: true, included: true,
          options: [
            { label: "Atlanta Market", value: "atl" },
            { label: "Las Vegas Market", value: "lvm" },
            { label: "High Point Market", value: "hpm" },
          ]},
        { id: uid(), displayName: "Product Interest", type: "multi_select", required: false, included: true,
          options: [
            { label: "Lighting", value: "lighting" },
            { label: "Furniture", value: "furniture" },
            { label: "Home Décor", value: "decor" },
            { label: "Textiles", value: "textiles" },
            { label: "Kitchen & Bath", value: "kb" },
          ]},
        { id: uid(), displayName: "Experience Rating", type: "rating", required: false, included: true, ratingScale: 5 },
        { id: uid(), displayName: "Notes", type: "long_text", required: false, included: true, placeholder: "Anything else?" },
      ]),
    ],
    afterSubmit: { mode: "message", message: "Thanks! Your rep will follow up shortly.", redirectUrl: "", delay: 3 },
    crm: { action: "create_retailer_account", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_retailer_account"), defaults: { opening_order_status: "prospect", how_did_you_hear: "trade_show" } },
    automation: { sendEmail: true, emailTemplate: "Trade Show Follow-Up", notifyTeam: true, notifyTargets: ["John Carmichael"], createTask: true, taskTitle: "Follow up with new trade show lead", taskAssignee: "Auto-assigned rep", taskDue: "+1 day", taskPriority: "High" },
    submissionCount: 47, viewCount: 412,
  };
}

const RAW_SEED_FORMS: Form[] = [
  leadCaptureForm(),
  {
    id: "f_contact", name: "Contact Us (Website)", slug: "contact-us",
    description: "Get in touch with our team.",
    status: "published", kind: "Contact",
    createdAt: "2026-01-15", updatedAt: "2026-05-28",
    multiStep: false,
    sections: [
      defaultBasicDetails(),
      legacySection("How can we help?", false, true, [
        { id: uid(), displayName: "Subject", type: "text", required: true, included: true },
        { id: uid(), displayName: "Message", type: "long_text", required: true, included: true, placeholder: "Tell us what you need..." },
        { id: uid(), displayName: "I agree to be contacted", type: "consent", required: true, included: true, consentText: "I agree to the privacy policy and to be contacted.", privacyUrl: "https://example.com/privacy" },
      ]),
    ],
    afterSubmit: { mode: "message", message: "Thanks! We'll be in touch within 1 business day.", redirectUrl: "", delay: 3 },
    crm: { action: "create_retailer_account", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_retailer_account"), defaults: { opening_order_status: "prospect", how_did_you_hear: "website" } },
    automation: { sendEmail: true, emailTemplate: "Thank You", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
    submissionCount: 132, viewCount: 1247,
  },
  {
    id: "f_rfq", name: "Request for Quote", slug: "rfq",
    description: "Request a custom wholesale quote.",
    status: "published", kind: "RFQ",
    createdAt: "2026-02-20", updatedAt: "2026-05-25",
    multiStep: true,
    sections: [
      defaultBasicDetails(),
      legacySection("Product Requirements", false, true, [
        { id: uid(), displayName: "Product category", type: "select", required: true, included: true,
          options: [
            { label: "Lighting", value: "lighting" },
            { label: "Furniture", value: "furniture" },
            { label: "Home Décor", value: "decor" },
          ]},
        { id: uid(), displayName: "Estimated quantity", type: "number", required: true, included: true },
        { id: uid(), displayName: "Target budget", type: "currency", required: false, included: true },
        { id: uid(), displayName: "Specs / attachment", type: "file", required: false, included: true },
      ]),
      legacySection("Timeline", false, true, [
        { id: uid(), displayName: "Needed by", type: "date", required: true, included: true },
        { id: uid(), displayName: "Notes", type: "long_text", required: false, included: true },
      ]),
    ],
    afterSubmit: { mode: "message", message: "Quote request received. Our team will respond within 2 business days.", redirectUrl: "", delay: 3 },
    crm: { action: "create_quote", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_quote"), defaults: { source: "rfq" } },
    automation: { sendEmail: true, emailTemplate: "RFQ Received", notifyTeam: true, notifyTargets: ["Tyler Jones"], createTask: true, taskTitle: "Prepare RFQ response", taskAssignee: "Tyler Jones", taskDue: "+2 days", taskPriority: "High" },
    submissionCount: 23, viewCount: 198,
  },
  {
    id: "f_account", name: "New Account Application", slug: "account-application",
    description: "Apply for a wholesale account.",
    status: "draft", kind: "Custom",
    createdAt: "2026-05-20", updatedAt: "2026-05-31",
    multiStep: false,
    sections: [defaultBasicDetails()],
    afterSubmit: { mode: "message", message: "Application received.", redirectUrl: "", delay: 3 },
    crm: { action: "create_credit_application", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_credit_application"), defaults: {} },
    automation: { sendEmail: false, emailTemplate: "Account Application Received", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
    submissionCount: 0, viewCount: 12,
  },
  {
    id: "f_feedback", name: "Post-Purchase Feedback", slug: "feedback",
    description: "Tell us how we did.",
    status: "archived", kind: "Custom",
    createdAt: "2025-11-01", updatedAt: "2026-03-15",
    multiStep: false,
    sections: [
      legacySection("Your Experience", true, true, [
        { id: uid(), displayName: "Overall rating", type: "rating", required: true, included: true, ratingScale: 5 },
        { id: uid(), displayName: "What went well?", type: "long_text", required: false, included: true },
        { id: uid(), displayName: "What could be improved?", type: "long_text", required: false, included: true },
        { id: uid(), displayName: "Your email", type: "email", required: false, included: true },
      ]),
    ],
    afterSubmit: { mode: "message", message: "Thanks for your feedback!", redirectUrl: "", delay: 3 },
    crm: { action: "log_activity", fieldMap: {}, matchKeys: getDefaultMatchKeys("log_activity"), defaults: { activity_type: "post_purchase_survey" } },
    automation: { sendEmail: false, emailTemplate: "General Acknowledgement", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Low" },
    submissionCount: 89, viewCount: 642,
  },

  // ── 8 new V2 seed forms ───────────────────────────────────────────────────
  {
    id: "f_sample_request", name: "Sample Request", slug: "sample-request",
    description: "Request product samples for evaluation.",
    status: "published", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: false,
    sections: [
      // Sample Request folded into Order (order_type = sample_complimentary).
      seedSection("Product Details", [
        ff("SKU", "lookup", { lookupEntity: "sku", required: true }),
        ff("Variant", "text"),
        ff("Quantity", "number", { required: true }),
      ], { quickAdd: true }),
      seedSection("Request Details", [
        pf("order.sample_purpose"),
        pf("order.sample_expected_order_volume_bucket"),
        pf("order.sample_willing_to_pay"),
        ff("Ship To", "text", { required: true }),
        pf("order.sample_return_due_date"),
      ]),
      seedSection("Additional", [
        ff("Notes", "long_text", { placeholder: "Anything else we should know?" }),
        ff("Trade Show", "lookup", { lookupEntity: "trade_show" }),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Sample request received. We'll ship shortly.", redirectUrl: "", delay: 3 },
    crm: { action: "create_order", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_order"), defaults: { order_type: "sample_complimentary", sample_status: "requested" } },
    automation: { sendEmail: true, emailTemplate: "Thank You", notifyTeam: true, notifyTargets: ["Auto-assigned rep"], createTask: true, taskTitle: "Ship sample & schedule follow-up", taskAssignee: "Auto-assigned rep", taskDue: "+1 day", taskPriority: "Medium" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_dealer_app", name: "Dealer / Reseller Application", slug: "dealer-application",
    description: "Apply to become an authorized dealer.",
    status: "published", kind: "Lead Capture",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: true,
    sections: [
      seedSection("Business Information", [
        pf("retailer.legal_name", { required: true }),
        pf("retailer.dba"),
        pf("retailer.ein", { required: true }),
        pf("retailer.business_type"),
        pf("retailer.website"),
        pf("retailer.years_in_business"),
        pf("retailer.categories_carried"),
        pf("retailer.channels"),
      ], { quickAdd: true }),
      seedSection("Territory & Commitment", [
        pf("retailer.territory_assigned"),
        pf("retailer.exclusivity_type"),
        pf("retailer.minimum_annual_commitment"),
        pf("retailer.store_count"),
      ]),
      seedSection("Contact", [
        pf("buyer.first_name", { required: true }),
        pf("buyer.last_name", { required: true }),
        pf("buyer.email", { required: true }),
        pf("buyer.phone"),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Application received. Our team will review and follow up.", redirectUrl: "", delay: 3 },
    crm: { action: "create_retailer_account", fieldMap: {}, matchKeys: ["retailer.ein", "retailer.legal_name"], defaults: { opening_order_status: "prospect", business_type: "independent_retailer" } },
    automation: { sendEmail: true, emailTemplate: "Account Application Received", notifyTeam: true, notifyTargets: ["John Carmichael"], createTask: true, taskTitle: "Review dealer application", taskAssignee: "John Carmichael", taskDue: "+2 days", taskPriority: "High" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_tax_exempt", name: "Tax Exemption Certificate", slug: "tax-exemption",
    description: "Submit a resale or tax exemption certificate.",
    status: "published", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: false,
    sections: [
      // Tax Exemption Certificate folded into Retailer Account as a nested
      // repeatable block (retailer.tax_cert_*).
      seedSection("Certificate Details", [
        pf("retailer.tax_cert_exemption_type", { required: true }),
        pf("retailer.tax_cert_state", { required: true }),
        pf("retailer.tax_cert_certificate_number", { required: true }),
        pf("retailer.tax_cert_expiration_date"),
        pf("retailer.tax_cert_certificate_file", { required: true }),
        pf("retailer.tax_cert_authorized_signatory"),
      ], { quickAdd: true }),
    ],
    afterSubmit: { mode: "message", message: "Certificate received. We'll verify it shortly.", redirectUrl: "", delay: 3 },
    crm: { action: "create_retailer_account", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_retailer_account"), defaults: { tax_cert_status: "pending" } },
    automation: { sendEmail: false, emailTemplate: "Thank You", notifyTeam: true, notifyTargets: ["Admin"], createTask: true, taskTitle: "Verify tax exemption certificate", taskAssignee: "Admin", taskDue: "+2 days", taskPriority: "Medium" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_claim", name: "Claim / RMA", slug: "claim-rma",
    description: "File a damage, defect, or shortage claim.",
    status: "published", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: false,
    sections: [
      seedSection("Claim Details", [
        pf("claim.claim_type", { required: true }),
        pf("claim.source_order", { required: true }),
        pf("claim.preferred_resolution"),
        pf("claim.urgency"),
      ], { quickAdd: true }),
      // Repeatable block — one set of claim-line fields per affected item.
      seedSection("Items Affected", [
        pf("claim.claim_line_sku"),
        pf("claim.claim_line_qty_affected"),
        pf("claim.claim_line_issue_description"),
        pf("claim.claim_line_photo_evidence"),
      ]),
      seedSection("Additional", [
        ff("Notes", "long_text", { placeholder: "Additional details about the claim" }),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Claim submitted. Our support team will be in touch.", redirectUrl: "", delay: 3 },
    crm: { action: "create_claim", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_claim"), defaults: { status: "submitted" } },
    automation: { sendEmail: true, emailTemplate: "General Acknowledgement", notifyTeam: true, notifyTargets: ["Admin"], createTask: true, taskTitle: "Review claim / RMA", taskAssignee: "Admin", taskDue: "+1 day", taskPriority: "High" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_standing_order", name: "Standing Order Setup", slug: "standing-order",
    description: "Set up a recurring standing order.",
    status: "published", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: true,
    sections: [
      // Standing Order folded into Order (order_type = standing_order_template,
      // Recurring Schedule sub-group).
      seedSection("Schedule", [
        ff("Template Name", "text", { required: true }),
        pf("order.schedule_frequency", { required: true }),
        pf("order.schedule_seasonal_months", {
          conditions: { logic: "AND", rules: [{ fieldId: "order.schedule_frequency", operator: "equals", value: "seasonal" }] },
        }),
        pf("order.schedule_start_date", { required: true }),
        pf("order.schedule_end_date"),
        pf("order.schedule_mode"),
      ], { quickAdd: true }),
      // Repeatable block — one SKU + qty line per product.
      seedSection("Products", [
        ff("SKU", "lookup", { lookupEntity: "sku" }),
        ff("Quantity", "number"),
      ]),
      seedSection("Payment & Shipping", [
        pf("order.payment_method"),
        ff("Preferred Shipping Method", "text"),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Standing order configured. First run will be reviewed before shipping.", redirectUrl: "", delay: 3 },
    crm: { action: "create_order", fieldMap: {}, matchKeys: getDefaultMatchKeys("create_order"), defaults: { order_type: "standing_order_template", schedule_status: "active", schedule_mode: "review_before_shipping" } },
    automation: { sendEmail: true, emailTemplate: "Thank You", notifyTeam: true, notifyTargets: ["Auto-assigned rep"], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_catalog", name: "Catalog Request", slug: "catalog-request",
    description: "Request our latest product catalog.",
    status: "published", kind: "Contact",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: false,
    sections: [
      seedSection("Your Information", [
        pf("retailer.legal_name", { displayName: "Name", required: true }),
        pf("buyer.email", { required: true }),
        pf("buyer.phone"),
      ], { quickAdd: true }),
      seedSection("Catalog Preferences", [
        pf("retailer.categories_carried", { displayName: "Categories of interest" }),
        ff("Preferred format", "select", {
          options: [
            { label: "Digital", value: "digital" },
            { label: "Physical", value: "physical" },
            { label: "Both", value: "both" },
          ],
        }),
      ]),
      seedSection("Shipping", [
        ff("Shipping address", "long_text", {
          placeholder: "Street, city, state, ZIP",
          conditions: { logic: "OR", rules: [
            { fieldId: "Preferred format", operator: "equals", value: "physical" },
            { fieldId: "Preferred format", operator: "equals", value: "both" },
          ] },
        }),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Thanks! Your catalog is on its way.", redirectUrl: "", delay: 3 },
    crm: { action: "log_activity", fieldMap: {}, matchKeys: getDefaultMatchKeys("log_activity"), defaults: { activity_type: "catalog_drop_sent" } },
    automation: { sendEmail: true, emailTemplate: "Thank You", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Low" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_vendor", name: "Vendor Onboarding", slug: "vendor-onboarding",
    description: "Onboard a new supplier or vendor.",
    status: "published", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: true,
    sections: [
      // Vendor entity removed (upstream supply-chain — wrong persona). This form
      // is now a CRM-less intake; a future Procurement module would own it.
      seedSection("Business Details", [
        ff("Legal Name", "text", { required: true }),
        ff("DBA", "text"),
        ff("EIN", "text", { required: true }),
        ff("Contact Name", "text", { required: true }),
        ff("Email", "email", { required: true }),
        ff("Phone", "phone"),
        ff("Website", "url"),
      ], { quickAdd: true }),
      seedSection("Compliance", [
        ff("W-9 File", "file", { required: true }),
        ff("Insurance Cert File", "file"),
        ff("Insurance Expiry", "date"),
        ff("Compliance Certifications", "text"),
      ]),
      seedSection("Terms", [
        ff("Payment Terms Requested", "text"),
        ff("Product Categories", "text"),
        ff("MOQ Policy", "text"),
        ff("Lead Time", "text"),
        ff("Returns Policy", "long_text"),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Vendor application received. We'll begin onboarding.", redirectUrl: "", delay: 3 },
    crm: { action: "none", fieldMap: {}, matchKeys: [], defaults: {} },
    automation: { sendEmail: true, emailTemplate: "Account Application Received", notifyTeam: true, notifyTargets: ["Admin"], createTask: true, taskTitle: "Onboard new vendor", taskAssignee: "Admin", taskDue: "+1 week", taskPriority: "Medium" },
    submissionCount: 0, viewCount: 0,
  },
  {
    id: "f_abr", name: "Annual Business Review Intake", slug: "abr-intake",
    description: "Collect annual business review feedback from retailers.",
    status: "draft", kind: "Custom",
    createdAt: "2026-06-09", updatedAt: "2026-06-09",
    multiStep: true,
    sections: [
      seedSection("Ratings", [
        ff("Overall satisfaction", "rating", { ratingScale: 5, required: true }),
        ff("Product quality", "rating", { ratingScale: 5 }),
        ff("Service", "rating", { ratingScale: 5 }),
      ], { quickAdd: true }),
      seedSection("Forward-Looking", [
        ff("Categories for next year", "multi_select", {
          options: [
            { label: "Lighting", value: "lighting" },
            { label: "Furniture", value: "furniture" },
            { label: "Home Decor", value: "home_decor" },
            { label: "Textiles", value: "textiles" },
            { label: "Rugs", value: "rugs" },
            { label: "Outdoor", value: "outdoor" },
            { label: "Gift", value: "gift" },
          ],
        }),
        ff("Budget change", "select", {
          options: [
            { label: "Decrease 20%+", value: "decrease_20_plus" },
            { label: "Decrease 10–20%", value: "decrease_10_20" },
            { label: "About the same", value: "same" },
            { label: "Increase 10–20%", value: "increase_10_20" },
            { label: "Increase 20%+", value: "increase_20_plus" },
          ],
        }),
      ]),
      seedSection("Open Feedback", [
        ff("What could we improve?", "long_text"),
        ff("New products wanted", "long_text"),
        ff("Willing to provide a testimonial?", "select", {
          options: [
            { label: "Yes", value: "yes" },
            { label: "Maybe", value: "maybe" },
            { label: "No", value: "no" },
          ],
        }),
      ]),
    ],
    afterSubmit: { mode: "message", message: "Thank you for your feedback!", redirectUrl: "", delay: 3 },
    crm: { action: "log_activity", fieldMap: {}, matchKeys: getDefaultMatchKeys("log_activity"), defaults: { activity_type: "abr_meeting" } },
    automation: { sendEmail: false, emailTemplate: "General Acknowledgement", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Low" },
    submissionCount: 0, viewCount: 0,
  },
];

const SEED_FORMS: Form[] = RAW_SEED_FORMS.map(migrateForm);

const SEED_RETAILERS: RetailerAccount[] = [
  {
    id: "C_01396", legal_name: "Flash Furnishing LLC", dba: "Flash Furnishing", ein: "84-1739204",
    email: "ap@flashfurnishing.com", opening_order_status: "active",
    payment_terms: "Net30", credit_limit: 25000, primary_rep: "John Carmichael",
    rep_group: "Southeast Home Group", territory_assigned: "Southeast", pricelist: "Wholesale", store_count: 3,
  },
  {
    id: "C_01200", legal_name: "Madison Creek Furnishings Inc.", dba: "Madison Creek", ein: "47-2856103",
    email: "ops@madisoncreek.com", opening_order_status: "active",
    payment_terms: "Net60", credit_limit: 80000, primary_rep: "John Carmichael",
    rep_group: "Southeast Home Group", territory_assigned: "Midwest", pricelist: "Preferred", store_count: 12,
  },
  {
    id: "C_01710", legal_name: "Pacific Coast Imports LLC", dba: "Pacific Coast Imports", ein: "91-3048221",
    email: "marcus@pacificcoast.com", opening_order_status: "prospect",
    payment_terms: "COD", territory_assigned: "West", pricelist: "Wholesale", store_count: 1,
  },
];

const SEED_SUBMISSIONS: Submission[] = [
  { id: "S_1001", formId: "f_contact", submitterName: "Sarah Mills", submitterEmail: "sarah@brightdecor.com", status: "new", submittedAt: "2026-06-01T14:34:00Z", values: { "Company name": "Bright Decor LLC", "Email ID": "sarah@brightdecor.com", "Subject": "Bulk pricing question", "Message": "I'd like to learn about bulk pricing for our spring catalog." }, associatedRecord: "C_01396" },
  { id: "S_1002", formId: "f_trade_show", submitterName: "Marcus Lin", submitterEmail: "marcus@pacificcoast.com", status: "actioned", submittedAt: "2026-05-28T10:15:00Z", values: { "Company name": "Pacific Coast Imports", "Email ID": "marcus@pacificcoast.com", "Trade Show": "Atlanta Market", "Product Interest": "Lighting" }, associatedRecord: "C_01396" },
  { id: "S_1003", formId: "f_trade_show", submitterName: "Linda Park", submitterEmail: "linda@madisoncreek.com", status: "reviewed", submittedAt: "2026-05-26T09:02:00Z", values: { "Company name": "Madison Creek Furnishings", "Trade Show": "Las Vegas Market", "Product Interest": "Furniture" }, associatedRecord: "C_01200" },
  { id: "S_1004", formId: "f_rfq", submitterName: "Hannah Rivera", submitterEmail: "hannah@finishingtouches.com", status: "new", submittedAt: "2026-05-30T16:20:00Z", values: { "Company name": "Finishing Touches", "Product category": "Lighting", "Estimated quantity": "250" } },
  { id: "S_1005", formId: "f_contact", submitterName: "David Cho", submitterEmail: "david@retailco.com", status: "reviewed", submittedAt: "2026-05-29T11:00:00Z", values: { "Company name": "Retail Co.", "Subject": "Catalog request", "Message": "Could you send your 2026 catalog?" } },
];

export interface WorkflowNode {
  id: string;
  type: "entry" | "condition" | "action";
  label: string;
  x: number;
  y: number;
  config?: Record<string, unknown>;
}
export interface WorkflowEdge { from: string; to: string; branch?: "true" | "false" }
export interface Workflow { id: string; name: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] }

const SEED_WORKFLOWS: Workflow[] = [
  { id: "w_1", name: "Trade Show Lead Routing",
    nodes: [
      { id: "n1", type: "entry", label: "Entry Point", x: 40, y: 200, config: { kind: "entry", entity: "Forms", formId: "f_trade_show" } },
      { id: "n2", type: "condition", label: "If EIN provided", x: 280, y: 200, config: { kind: "condition", field: "retailer.ein", operator: "not_empty", value: "" } },
      { id: "n3", type: "action", label: "Create Retailer Account", x: 540, y: 70, config: { kind: "create_retailer_account", defaults: { opening_order_status: "prospect" } } },
      { id: "n4", type: "action", label: "Assign Sales Rep", x: 800, y: 70, config: { kind: "assign_rep", assignMode: "round-robin" } },
      { id: "n5", type: "action", label: "Send Notification", x: 1060, y: 70, config: { kind: "send_notification", target: "Assigned rep" } },
      { id: "n6", type: "action", label: "Create Buyer Contact", x: 540, y: 330, config: { kind: "create_buyer_contact" } },
      { id: "n7", type: "action", label: "Assign Sales Rep", x: 800, y: 330, config: { kind: "assign_rep", assignMode: "round-robin" } },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", branch: "true" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
      { from: "n2", to: "n6", branch: "false" },
      { from: "n6", to: "n7" },
    ]},
  { id: "w_2", name: "RFQ → Quote Routing",
    nodes: [
      { id: "n1", type: "entry", label: "Entry Point", x: 40, y: 200, config: { kind: "entry", entity: "Forms", formId: "f_rfq" } },
      { id: "n2", type: "action", label: "Create Quote", x: 280, y: 200, config: { kind: "create_quote", defaults: { source: "rfq" } } },
      { id: "n3", type: "condition", label: "If grand_total > $50,000", x: 520, y: 200, config: { kind: "condition", field: "quote.grand_total", operator: "greater_than", value: "50000" } },
      { id: "n4", type: "action", label: "Assign Sales Rep", x: 780, y: 70, config: { kind: "assign_rep", assignMode: "fixed", rep: "Senior Rep" } },
      { id: "n5", type: "action", label: "Create Task", x: 1040, y: 70, config: { kind: "create_task", title: "Review high-value quote" } },
      { id: "n6", type: "action", label: "Send Notification", x: 1300, y: 70, config: { kind: "send_notification", target: "Sales Manager" } },
      { id: "n7", type: "action", label: "Assign Sales Rep", x: 780, y: 330, config: { kind: "assign_rep", assignMode: "round-robin" } },
      { id: "n8", type: "action", label: "Send Notification", x: 1040, y: 330, config: { kind: "send_notification", target: "Assigned rep" } },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3" },
      { from: "n3", to: "n4", branch: "true" },
      { from: "n4", to: "n5" },
      { from: "n5", to: "n6" },
      { from: "n3", to: "n7", branch: "false" },
      { from: "n7", to: "n8" },
    ]},
];

interface StoreCtx {
  forms: Form[];
  submissions: Submission[];
  retailers: RetailerAccount[];
  workflows: Workflow[];
  customProperties: CrmPropertySeed[];
  getForm: (id: string) => Form | undefined;
  createForm: () => Form;
  updateForm: (id: string, patch: Partial<Form>) => void;
  cloneForm: (id: string) => Form | null;
  archiveForm: (id: string) => void;
  deleteForm: (id: string) => void;
  updateSection: (formId: string, sectionId: string, patch: Partial<FormSection>) => void;
  reorderSections: (formId: string, ids: string[]) => void;
  addSection: (formId: string) => void;
  removeSection: (formId: string, sectionId: string) => void;
  // Legacy field actions (re-implemented on rows; each new field goes into its own full-width row)
  addField: (formId: string, sectionId: string, field: FormField) => void;
  updateField: (formId: string, sectionId: string, fieldId: string, patch: Partial<FormField>) => void;
  removeField: (formId: string, sectionId: string, fieldId: string) => void;
  moveField: (formId: string, fromSection: string, toSection: string, fieldId: string, toIndex: number) => void;
  // New row-aware actions
  addRow: (formId: string, sectionId: string, row: FormRow, index?: number) => void;
  removeRow: (formId: string, sectionId: string, rowId: string) => void;
  moveRow: (formId: string, fromSectionId: string, toSectionId: string, rowId: string, toIndex: number) => void;
  updateRow: (formId: string, sectionId: string, rowId: string, patch: Partial<FormRow>) => void;
  addFieldToRow: (formId: string, sectionId: string, rowId: string, field: FormField, slotIndex?: number) => void;
  moveFieldBetweenRows: (formId: string, fromSectionId: string, fromRowId: string, toSectionId: string, toRowId: string, fieldId: string, toIndex: number) => void;
  moveFieldToNewRow: (formId: string, fromSectionId: string, fromRowId: string, toSectionId: string, toRowIndex: number, fieldId: string) => void;
  duplicateField: (formId: string, sectionId: string, rowId: string, fieldId: string) => void;
  addCustomProperty: (prop: CrmPropertySeed) => void;
  addSubmission: (s: Submission) => void;
  updateSubmission: (id: string, patch: Partial<Submission>) => void;
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function balanceWidths(row: FormRow): FormRow {
  if (row.kind !== "fields" || !row.fields) return row;
  const n = row.fields.length;
  // Only auto-assign when field has no explicit width (or width left over from previous row size)
  return {
    ...row,
    fields: row.fields.map((f) => {
      if (f.width && f.width !== "full" && n === 1) return { ...f, width: "full" };
      if (!f.width || (n === 2 && f.width === "third") || (n === 3 && f.width === "half") || (n === 1 && f.width !== "full")) {
        const w: FieldWidth = n === 1 ? "full" : n === 2 ? "half" : "third";
        return { ...f, width: w };
      }
      return f;
    }),
  };
}

export function FormsStoreProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<Form[]>(SEED_FORMS);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [retailers] = useState<RetailerAccount[]>(SEED_RETAILERS);
  const [workflows, setWorkflows] = useState<Workflow[]>(SEED_WORKFLOWS);
  const [customProperties, setCustomProperties] = useState<CrmPropertySeed[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  const mapSection = (formId: string, sectionId: string, fn: (s: FormSection) => FormSection) =>
    setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.map((s) => s.id === sectionId ? fn(s) : s), updatedAt: today } : f));

  const value: StoreCtx = {
    forms, submissions, retailers, workflows, customProperties,
    getForm: (id) => forms.find((f) => f.id === id),
    createForm: () => {
      const base: Form = {
        id: "f_" + uid(), name: "Untitled Form", slug: "untitled-" + uid(),
        description: "", status: "draft", kind: "Custom",
        createdAt: today, updatedAt: today,
        multiStep: false,
        sections: [],
        afterSubmit: { mode: "message", message: "Thank you! Your submission has been received.", redirectUrl: "", delay: 3 },
        crm: { action: "none", fieldMap: {}, matchKeys: [], defaults: {} },
        automation: { sendEmail: false, emailTemplate: "Thank You", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
        submissionCount: 0, viewCount: 0,
      };
      const f = migrateForm(base);
      setForms((p) => [f, ...p]);
      return f;
    },
    updateForm: (id, patch) => setForms((p) => p.map((f) => f.id === id ? migrateForm({ ...f, ...patch, updatedAt: today }) : f)),
    cloneForm: (id) => {
      const orig = forms.find((f) => f.id === id);
      if (!orig) return null;
      const copy: Form = JSON.parse(JSON.stringify({ ...orig, id: "f_" + uid(), name: orig.name + " (Copy)", slug: orig.slug + "-copy-" + uid(), status: "draft", submissionCount: 0, viewCount: 0, createdAt: today, updatedAt: today }));
      setForms((p) => [copy, ...p]);
      return copy;
    },
    archiveForm: (id) => setForms((p) => p.map((f) => f.id === id ? { ...f, status: "archived" as FormStatus } : f)),
    deleteForm: (id) => setForms((p) => p.filter((f) => f.id !== id)),
    updateSection: (formId, sectionId, patch) =>
      mapSection(formId, sectionId, (s) => ({ ...s, ...patch })),
    reorderSections: (formId, ids) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        const map = new Map(f.sections.map((s) => [s.id, s]));
        return { ...f, sections: ids.map((i) => map.get(i)!).filter(Boolean), updatedAt: today };
      })),
    addSection: (formId) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: [...f.sections, { id: uid(), name: "New Section", quickAdd: false, show: true, rows: [] }], updatedAt: today } : f)),
    removeSection: (formId, sectionId) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.filter((s) => s.id !== sectionId), updatedAt: today } : f)),
    addField: (formId, sectionId, field) =>
      mapSection(formId, sectionId, (s) => ({ ...s, rows: [...s.rows, { id: uid(), kind: "fields", fields: [{ ...field, width: "full" }] }] })),
    updateField: (formId, sectionId, fieldId, patch) =>
      mapSection(formId, sectionId, (s) => ({
        ...s,
        rows: s.rows.map((r) => {
          if (r.kind !== "fields" || !r.fields) return r;
          const updated = { ...r, fields: r.fields.map((fl) => fl.id === fieldId ? { ...fl, ...patch } : fl) };
          // Re-balance only when a width change was included in the patch.
          return "width" in patch ? balanceWidths(updated) : updated;
        }),
      })),
    removeField: (formId, sectionId, fieldId) =>
      mapSection(formId, sectionId, (s) => ({
        ...s,
        rows: s.rows
          .map((r) => r.kind === "fields" && r.fields ? { ...r, fields: r.fields.filter((fl) => fl.id !== fieldId) } : r)
          .filter((r) => !(r.kind === "fields" && (!r.fields || r.fields.length === 0)))
          .map((r) => r.kind === "fields" ? balanceWidths(r) : r),
      })),
    moveField: (formId, fromSec, toSec, fieldId, toIndex) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        let moving: FormField | undefined;
        // Pull from source section's rows (single-field rows in legacy path)
        const cleared = f.sections.map((s) => {
          if (s.id !== fromSec) return s;
          let found: FormField | undefined;
          const newRows: FormRow[] = [];
          for (const r of s.rows) {
            if (r.kind === "fields" && r.fields) {
              const idx = r.fields.findIndex((fl) => fl.id === fieldId);
              if (idx >= 0) {
                found = r.fields[idx];
                const remaining = r.fields.filter((_, i) => i !== idx);
                if (remaining.length > 0) newRows.push(balanceWidths({ ...r, fields: remaining }));
                continue;
              }
            }
            newRows.push(r);
          }
          if (found) moving = found;
          return { ...s, rows: newRows };
        });
        if (!moving) return f;
        const final = cleared.map((s) => {
          if (s.id !== toSec) return s;
          const newRow: FormRow = { id: uid(), kind: "fields", fields: [{ ...moving!, width: "full" }] };
          const rows = [...s.rows];
          const insertAt = Math.max(0, Math.min(toIndex, rows.length));
          rows.splice(insertAt, 0, newRow);
          return { ...s, rows };
        });
        return { ...f, sections: final, updatedAt: today };
      })),
    addRow: (formId, sectionId, row, index) =>
      mapSection(formId, sectionId, (s) => {
        const rows = [...s.rows];
        const at = index === undefined ? rows.length : Math.max(0, Math.min(index, rows.length));
        const r = row.kind === "fields" ? balanceWidths(row) : row;
        rows.splice(at, 0, r);
        return { ...s, rows };
      }),
    removeRow: (formId, sectionId, rowId) =>
      mapSection(formId, sectionId, (s) => ({ ...s, rows: s.rows.filter((r) => r.id !== rowId) })),
    moveRow: (formId, fromSectionId, toSectionId, rowId, toIndex) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        let moving: FormRow | undefined;
        const cleared = f.sections.map((s) => {
          if (s.id !== fromSectionId) return s;
          const idx = s.rows.findIndex((r) => r.id === rowId);
          if (idx < 0) return s;
          moving = s.rows[idx];
          return { ...s, rows: s.rows.filter((_, i) => i !== idx) };
        });
        if (!moving) return f;
        const final = cleared.map((s) => {
          if (s.id !== toSectionId) return s;
          const rows = [...s.rows];
          rows.splice(Math.max(0, Math.min(toIndex, rows.length)), 0, moving!);
          return { ...s, rows };
        });
        return { ...f, sections: final, updatedAt: today };
      })),
    updateRow: (formId, sectionId, rowId, patch) =>
      mapSection(formId, sectionId, (s) => ({
        ...s,
        rows: s.rows.map((r) => r.id === rowId ? { ...r, ...patch } : r),
      })),
    addFieldToRow: (formId, sectionId, rowId, field, slotIndex) =>
      mapSection(formId, sectionId, (s) => ({
        ...s,
        rows: s.rows.map((r) => {
          if (r.id !== rowId || r.kind !== "fields") return r;
          const existing = r.fields ?? [];
          if (existing.length >= 3) return r;
          const next = [...existing];
          const at = slotIndex === undefined ? next.length : Math.max(0, Math.min(slotIndex, next.length));
          next.splice(at, 0, field);
          return balanceWidths({ ...r, fields: next });
        }),
      })),
    moveFieldBetweenRows: (formId, fromSectionId, fromRowId, toSectionId, toRowId, fieldId, toIndex) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        let moving: FormField | undefined;
        const sections = f.sections.map((s) => {
          if (s.id !== fromSectionId) return s;
          return {
            ...s,
            rows: s.rows
              .map((r) => {
                if (r.id !== fromRowId || r.kind !== "fields" || !r.fields) return r;
                const idx = r.fields.findIndex((fl) => fl.id === fieldId);
                if (idx < 0) return r;
                moving = r.fields[idx];
                const remaining = r.fields.filter((_, i) => i !== idx);
                return { ...r, fields: remaining };
              })
              .filter((r) => !(r.kind === "fields" && (!r.fields || r.fields.length === 0) && r.id === fromRowId))
              .map((r) => r.kind === "fields" ? balanceWidths(r) : r),
          };
        });
        if (!moving) return f;
        const finalSections = sections.map((s) => {
          if (s.id !== toSectionId) return s;
          return {
            ...s,
            rows: s.rows.map((r) => {
              if (r.id !== toRowId || r.kind !== "fields") return r;
              const existing = r.fields ?? [];
              if (existing.length >= 3) return r;
              const next = [...existing];
              const at = Math.max(0, Math.min(toIndex, next.length));
              next.splice(at, 0, moving!);
              return balanceWidths({ ...r, fields: next });
            }),
          };
        });
        return { ...f, sections: finalSections, updatedAt: today };
      })),
    moveFieldToNewRow: (formId, fromSectionId, fromRowId, toSectionId, toRowIndex, fieldId) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        let moving: FormField | undefined;
        // Pull the field from its source row (within source section) and prune the
        // source row if it becomes empty.
        const afterRemoval = f.sections.map((s) => {
          if (s.id !== fromSectionId) return s;
          return {
            ...s,
            rows: s.rows
              .map((r) => {
                if (r.id !== fromRowId || r.kind !== "fields" || !r.fields) return r;
                const idx = r.fields.findIndex((fl) => fl.id === fieldId);
                if (idx < 0) return r;
                moving = r.fields[idx];
                return { ...r, fields: r.fields.filter((_, i) => i !== idx) };
              })
              .filter((r) => !(r.kind === "fields" && (!r.fields || r.fields.length === 0)))
              .map((r) => r.kind === "fields" ? balanceWidths(r) : r),
          };
        });
        if (!moving) return f;
        const newRow: FormRow = { id: uid(), kind: "fields", fields: [{ ...moving, width: "full" }] };
        const finalSections = afterRemoval.map((s) => {
          if (s.id !== toSectionId) return s;
          const nextRows = [...s.rows];
          const at = Math.max(0, Math.min(toRowIndex, nextRows.length));
          nextRows.splice(at, 0, newRow);
          return { ...s, rows: nextRows };
        });
        return { ...f, sections: finalSections, updatedAt: today };
      })),
    duplicateField: (formId, sectionId, rowId, fieldId) =>
      mapSection(formId, sectionId, (s) => {
        const idx = s.rows.findIndex((r) => r.id === rowId);
        if (idx < 0) return s;
        const r = s.rows[idx];
        if (r.kind !== "fields" || !r.fields) return s;
        const f = r.fields.find((fl) => fl.id === fieldId);
        if (!f) return s;
        const copy: FormField = { ...f, id: uid(), displayName: f.displayName + " copy", propertyId: undefined };
        const newRow: FormRow = { id: uid(), kind: "fields", fields: [{ ...copy, width: "full" }] };
        const rows = [...s.rows];
        rows.splice(idx + 1, 0, newRow);
        return { ...s, rows };
      }),
    addCustomProperty: (prop) => setCustomProperties((p) => [...p, prop]),
    addSubmission: (s) => {
      setSubmissions((p) => [s, ...p]);
      setForms((p) => p.map((f) => f.id === s.formId ? { ...f, submissionCount: f.submissionCount + 1 } : f));
    },
    updateSubmission: (id, patch) => setSubmissions((p) => p.map((s) => s.id === id ? { ...s, ...patch } : s)),
    updateWorkflow: (id, patch) => setWorkflows((p) => p.map((w) => w.id === id ? { ...w, ...patch } : w)),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside FormsStoreProvider");
  return v;
}

export const FIELD_TYPE_META: Record<FieldType, { label: string; icon: string }> = {
  text: { label: "Text", icon: "Type" },
  long_text: { label: "Long text", icon: "AlignLeft" },
  percentage: { label: "Percentage", icon: "Percent" },
  select: { label: "Select", icon: "List" },
  multi_select: { label: "Multi select", icon: "ListChecks" },
  url: { label: "URL", icon: "Link" },
  html: { label: "HTML", icon: "Code" },
  email: { label: "Email", icon: "AtSign" },
  number: { label: "Number", icon: "Hash" },
  phone: { label: "Phone_e164", icon: "Phone" },
  checkbox: { label: "Checkbox", icon: "CheckSquare" },
  date: { label: "Date", icon: "Calendar" },
  file: { label: "File", icon: "File" },
  currency: { label: "Currency", icon: "DollarSign" },
  hidden: { label: "Hidden", icon: "EyeOff" },
  radio: { label: "Radio Button", icon: "Circle" },
  rating: { label: "Rating", icon: "Star" },
  consent: { label: "Consent Checkbox", icon: "ShieldCheck" },
  lookup: { label: "Lookup", icon: "Search" },
};

export const newField = (type: FieldType, displayName: string): FormField => ({
  id: uid(), displayName, type, required: false, included: true, width: "full",
  ...(type === "select" || type === "multi_select" || type === "radio"
    ? { options: [{ label: "Option 1", value: "opt1" }, { label: "Option 2", value: "opt2" }] }
    : {}),
  ...(type === "rating" ? { ratingScale: 5 as const } : {}),
  ...(type === "consent" ? { consentText: "I agree to the terms and privacy policy.", privacyUrl: "" } : {}),
});

export const newId = () => uid();
