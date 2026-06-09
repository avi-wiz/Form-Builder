import type { FieldType, FieldOption } from "./forms-store";

const US_STATES: FieldOption[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"],
  ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"],
  ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"],
  ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"],
  ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"],
  ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"],
  ["WI", "Wisconsin"], ["WY", "Wyoming"],
].map(([value, label]) => ({ value, label }));

// Entity-model pruning notes:
// - Vendor was removed: it is upstream supply-chain — wrong persona for this
//   product. If procurement onboarding is needed, build a separate Procurement module.
// - Standing Order and Sample Request were folded into Order (via order_type +
//   dedicated sub-groups). Tax Exemption Certificate was folded into Retailer
//   Account as a nested repeatable block.
// - Trade Show is admin-managed master data (reference-only), still used as a
//   lookup target by other entities — but not form-creatable.
export type EntityType =
  | "retailer_account" | "contact" | "quote" | "order"
  | "credit_application" | "claim"
  | "ticket" | "touchpoint" | "campaign_response"
  // Reference-only (no create action; used as lookup targets):
  | "trade_show"
  | "sales_rep" | "rep_group" | "price_list" | "payment_method"
  | "store_location" | "sku" | "custom";

export type CrmAction =
  | "none"
  | "create_retailer_account" | "create_contact" | "create_quote"
  | "create_order" | "create_credit_application" | "create_claim"
  | "create_ticket" | "log_touchpoint" | "log_campaign_response";

export interface CrmPropertySeed {
  id: string;                    // e.g. "retailer.ein", "quote.expiry_date"
  label: string;
  entity: EntityType;
  group: string;                 // sub-group: "Identity & Structure", "Commerce State", etc.
  defaultFieldType: FieldType;
  commonlyUsed?: boolean;
  options?: FieldOption[];
  helpText?: string;
  lookupEntity?: EntityType;     // for lookup fields — what entity to look up
  referenceOnly?: boolean;
}

export const PROPERTY_GROUPS: {
  entity: EntityType;
  label: string;
  subGroups: string[];
  referenceOnly?: boolean;
}[] = [
  // ── Createable entities (9) ───────────────────────────────────────────────
  {
    entity: "retailer_account",
    label: "Retailer Account",
    subGroups: ["Identity & Structure", "Commerce State", "Financial State", "GTM", "Logistics", "Tax Exemption Certificates"],
  },
  {
    entity: "contact",
    label: "Contact",
    subGroups: ["Personal", "Role", "Preferences", "Association"],
  },
  {
    entity: "quote",
    label: "Quote",
    subGroups: ["Header", "Pricing", "Shipping & Delivery", "Status & Context"],
  },
  {
    entity: "order",
    label: "Order",
    subGroups: ["Header", "Routing", "Delivery Preferences", "Recurring Schedule", "Sample Details", "Status"],
  },
  {
    entity: "credit_application",
    label: "Credit Application",
    subGroups: ["Submission", "Requested Terms", "Identity & Financial", "Trade References", "Files", "Decision"],
  },
  {
    entity: "claim",
    label: "Claim / RMA",
    subGroups: ["Header", "Claim Line Items"],
  },
  {
    entity: "ticket",
    label: "Ticket",
    subGroups: ["General"],
  },
  {
    entity: "touchpoint",
    label: "Touchpoint",
    subGroups: ["General"],
  },
  {
    entity: "campaign_response",
    label: "Campaign Response",
    subGroups: ["General"],
  },

  // ── Reference-only entities (7) ───────────────────────────────────────────
  {
    entity: "trade_show",
    label: "Trade Show",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "sales_rep",
    label: "Sales Rep",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "rep_group",
    label: "Rep Group",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "price_list",
    label: "Price List",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "payment_method",
    label: "Payment Method",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "store_location",
    label: "Store Location",
    subGroups: ["General"],
    referenceOnly: true,
  },
  {
    entity: "sku",
    label: "SKU",
    subGroups: ["General"],
    referenceOnly: true,
  },
];

export const CRM_PROPERTIES: CrmPropertySeed[] = [
  // ════════════════════════════════════════════════════════════════════════
  // Retailer Account
  // ════════════════════════════════════════════════════════════════════════

  // ── Identity & Structure ──────────────────────────────────────────────────
  { id: "retailer.legal_name", label: "Legal Name", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "text", commonlyUsed: true },
  { id: "retailer.dba", label: "DBA", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "text", commonlyUsed: true },
  { id: "retailer.ein", label: "EIN", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "text", commonlyUsed: true, helpText: "Employer Identification Number — 9-digit federal tax ID" },
  { id: "retailer.parent_account", label: "Parent Account", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "lookup", lookupEntity: "retailer_account" },
  { id: "retailer.store_count", label: "Store Count", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "number" },
  { id: "retailer.business_type", label: "Business Type", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "select",
    options: [
      { label: "Independent Retailer", value: "independent_retailer" },
      { label: "Regional Chain", value: "regional_chain" },
      { label: "National Chain", value: "national_chain" },
      { label: "Pureplay E-commerce", value: "pureplay_ecom" },
      { label: "Interior Designer", value: "interior_designer" },
      { label: "Hospitality", value: "hospitality" },
      { label: "Other", value: "other" },
    ]},
  { id: "retailer.categories_carried", label: "Categories Carried", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "multi_select",
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Home Decor", value: "home_decor" },
      { label: "Textiles", value: "textiles" },
      { label: "Rugs", value: "rugs" },
      { label: "Outdoor", value: "outdoor" },
      { label: "Gift", value: "gift" },
    ]},
  { id: "retailer.channels", label: "Channels", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "multi_select",
    options: [
      { label: "Brick & Mortar", value: "brick" },
      { label: "E-commerce", value: "ecom" },
      { label: "Both", value: "both" },
    ]},
  { id: "retailer.website", label: "Website", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "url" },
  { id: "retailer.social_handles", label: "Social Handles", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "text" },
  { id: "retailer.years_in_business", label: "Years in Business", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "number" },
  { id: "retailer.referral_source", label: "Referral Source", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "text" },
  { id: "retailer.how_did_you_hear", label: "How Did You Hear", entity: "retailer_account", group: "Identity & Structure", defaultFieldType: "select",
    options: [
      { label: "Trade Show", value: "trade_show" },
      { label: "Website", value: "website" },
      { label: "Google", value: "google" },
      { label: "Referral", value: "referral" },
      { label: "Social", value: "social" },
      { label: "Other", value: "other" },
    ]},

  // ── Commerce State ────────────────────────────────────────────────────────
  { id: "retailer.opening_order_status", label: "Opening Order Status", entity: "retailer_account", group: "Commerce State", defaultFieldType: "select", commonlyUsed: true,
    helpText: "Replaces the old Lead vs Customer distinction. A prospect is a Lead that hasn't placed an opening order yet.",
    options: [
      { label: "Prospect", value: "prospect" },
      { label: "Opened", value: "opened" },
      { label: "Active", value: "active" },
      { label: "Dormant (90d)", value: "dormant_90d" },
      { label: "Dormant (180d)", value: "dormant_180d" },
      { label: "Lost", value: "lost" },
      { label: "Reactivated", value: "reactivated" },
    ]},
  { id: "retailer.first_order_date", label: "First Order Date", entity: "retailer_account", group: "Commerce State", defaultFieldType: "date" },
  { id: "retailer.last_order_date", label: "Last Order Date", entity: "retailer_account", group: "Commerce State", defaultFieldType: "date" },
  { id: "retailer.days_since_last_order", label: "Days Since Last Order", entity: "retailer_account", group: "Commerce State", defaultFieldType: "number" },
  { id: "retailer.predicted_next_order_date", label: "Predicted Next Order Date", entity: "retailer_account", group: "Commerce State", defaultFieldType: "date" },
  { id: "retailer.ltv_gmv", label: "LTV GMV", entity: "retailer_account", group: "Commerce State", defaultFieldType: "currency" },
  { id: "retailer.ttm_gmv", label: "TTM GMV", entity: "retailer_account", group: "Commerce State", defaultFieldType: "currency" },
  { id: "retailer.ytd_gmv", label: "YTD GMV", entity: "retailer_account", group: "Commerce State", defaultFieldType: "currency" },
  { id: "retailer.aov", label: "AOV", entity: "retailer_account", group: "Commerce State", defaultFieldType: "currency" },
  { id: "retailer.reorder_frequency_days", label: "Reorder Frequency (days)", entity: "retailer_account", group: "Commerce State", defaultFieldType: "number" },

  // ── Financial State ───────────────────────────────────────────────────────
  { id: "retailer.payment_terms", label: "Payment Terms", entity: "retailer_account", group: "Financial State", defaultFieldType: "select", commonlyUsed: true,
    helpText: "EOM = End of Month — payment due by last day of the month following invoice",
    options: [
      { label: "COD", value: "COD" },
      { label: "CIA", value: "CIA" },
      { label: "Net 15", value: "Net15" },
      { label: "Net 30", value: "Net30" },
      { label: "Net 45", value: "Net45" },
      { label: "Net 60", value: "Net60" },
      { label: "EOM", value: "EOM" },
    ]},
  { id: "retailer.credit_limit", label: "Credit Limit", entity: "retailer_account", group: "Financial State", defaultFieldType: "currency", commonlyUsed: true },
  { id: "retailer.ar_balance", label: "AR Balance", entity: "retailer_account", group: "Financial State", defaultFieldType: "currency" },
  { id: "retailer.ar_aging_buckets", label: "AR Aging Buckets", entity: "retailer_account", group: "Financial State", defaultFieldType: "text" },
  { id: "retailer.on_credit_hold", label: "On Credit Hold", entity: "retailer_account", group: "Financial State", defaultFieldType: "checkbox" },
  { id: "retailer.credit_hold_reason", label: "Credit Hold Reason", entity: "retailer_account", group: "Financial State", defaultFieldType: "text" },
  { id: "retailer.tax_exempt", label: "Tax Exempt", entity: "retailer_account", group: "Financial State", defaultFieldType: "checkbox", helpText: "Auto-derived from active Tax Exemption Certificates — not directly editable" },
  { id: "retailer.resale_cert_on_file", label: "Resale Cert on File", entity: "retailer_account", group: "Financial State", defaultFieldType: "checkbox" },

  // ── GTM ───────────────────────────────────────────────────────────────────
  { id: "retailer.primary_rep", label: "Primary Rep", entity: "retailer_account", group: "GTM", defaultFieldType: "lookup", lookupEntity: "sales_rep", commonlyUsed: true },
  { id: "retailer.rep_group", label: "Rep Group", entity: "retailer_account", group: "GTM", defaultFieldType: "lookup", lookupEntity: "rep_group" },
  { id: "retailer.territory_assigned", label: "Territory Assigned", entity: "retailer_account", group: "GTM", defaultFieldType: "text" },
  { id: "retailer.exclusivity_type", label: "Exclusivity Type", entity: "retailer_account", group: "GTM", defaultFieldType: "select",
    helpText: "Semi-exclusive = territory protection without total exclusivity",
    options: [
      { label: "None", value: "none" },
      { label: "Semi-Exclusive", value: "semi_exclusive" },
      { label: "Exclusive", value: "exclusive" },
    ]},
  { id: "retailer.minimum_annual_commitment", label: "Minimum Annual Commitment", entity: "retailer_account", group: "GTM", defaultFieldType: "currency" },
  { id: "retailer.assigned_csm", label: "Assigned CSM", entity: "retailer_account", group: "GTM", defaultFieldType: "text" },
  { id: "retailer.opening_order_minimum_met", label: "Opening Order Minimum Met", entity: "retailer_account", group: "GTM", defaultFieldType: "checkbox" },
  { id: "retailer.map_compliance_tier", label: "MAP Compliance Tier", entity: "retailer_account", group: "GTM", defaultFieldType: "select",
    options: [
      { label: "Compliant", value: "compliant" },
      { label: "Watch", value: "watch" },
      { label: "Probation", value: "probation" },
      { label: "Suspended", value: "suspended" },
    ]},
  { id: "retailer.map_violations_count", label: "MAP Violations Count", entity: "retailer_account", group: "GTM", defaultFieldType: "number", helpText: "MAP = Minimum Advertised Price — violations tracked per retailer" },

  // ── Logistics ─────────────────────────────────────────────────────────────
  { id: "retailer.ship_complete_preference", label: "Ship Complete Preference", entity: "retailer_account", group: "Logistics", defaultFieldType: "checkbox" },
  { id: "retailer.preferred_carrier", label: "Preferred Carrier", entity: "retailer_account", group: "Logistics", defaultFieldType: "text" },
  { id: "retailer.default_ship_to_street", label: "Default Ship-To Street", entity: "retailer_account", group: "Logistics", defaultFieldType: "text" },
  { id: "retailer.default_ship_to_city", label: "Default Ship-To City", entity: "retailer_account", group: "Logistics", defaultFieldType: "text" },
  { id: "retailer.default_ship_to_state", label: "Default Ship-To State", entity: "retailer_account", group: "Logistics", defaultFieldType: "text", commonlyUsed: true },
  { id: "retailer.default_ship_to_zip", label: "Default Ship-To Zip", entity: "retailer_account", group: "Logistics", defaultFieldType: "text" },
  { id: "retailer.blind_ship_required", label: "Blind Ship Required", entity: "retailer_account", group: "Logistics", defaultFieldType: "checkbox", helpText: "Blind ship = remove supplier branding from packaging; common for drop-ship retailers" },

  // ── Tax Exemption Certificates (1:many nested repeatable block) ────────────
  // Folded in from the former Tax Exemption Certificate entity. Same repeatable-
  // block pattern as Credit App trade references and Claim line items: one set of
  // these fields per certificate. retailer.tax_exempt is auto-derived from active certs.
  { id: "retailer.tax_cert_state", label: "Tax Cert — State", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "select", options: US_STATES, helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_exemption_type", label: "Tax Cert — Exemption Type", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "select",
    helpText: "Repeatable block — add one set of certificate fields per state",
    options: [
      { label: "Resale", value: "resale" },
      { label: "Non-Profit", value: "non_profit" },
      { label: "Government", value: "government" },
      { label: "Other", value: "other" },
    ]},
  { id: "retailer.tax_cert_certificate_number", label: "Tax Cert — Certificate Number", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "text", helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_expiration_date", label: "Tax Cert — Expiration Date", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "date", helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_certificate_file", label: "Tax Cert — Certificate File", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "file", helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_authorized_signatory", label: "Tax Cert — Authorized Signatory", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "text", helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_status", label: "Tax Cert — Status", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "select",
    helpText: "Repeatable block — add one set of certificate fields per state",
    options: [
      { label: "Pending", value: "pending" },
      { label: "Verified", value: "verified" },
      { label: "Expired", value: "expired" },
      { label: "Revoked", value: "revoked" },
    ]},
  { id: "retailer.tax_cert_verified_by", label: "Tax Cert — Verified By", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "text", helpText: "Repeatable block — add one set of certificate fields per state" },
  { id: "retailer.tax_cert_verified_date", label: "Tax Cert — Verified Date", entity: "retailer_account", group: "Tax Exemption Certificates", defaultFieldType: "date", helpText: "Repeatable block — add one set of certificate fields per state" },

  // ════════════════════════════════════════════════════════════════════════
  // Contact (not all contacts are buyers — owners, AP, store managers, designers)
  // ════════════════════════════════════════════════════════════════════════

  // ── Personal ──────────────────────────────────────────────────────────────
  { id: "contact.first_name", label: "First Name", entity: "contact", group: "Personal", defaultFieldType: "text", commonlyUsed: true },
  { id: "contact.last_name", label: "Last Name", entity: "contact", group: "Personal", defaultFieldType: "text", commonlyUsed: true },
  { id: "contact.email", label: "Email", entity: "contact", group: "Personal", defaultFieldType: "email", commonlyUsed: true },
  { id: "contact.phone", label: "Phone", entity: "contact", group: "Personal", defaultFieldType: "phone", commonlyUsed: true },
  { id: "contact.phone_is_shared_line", label: "Phone Is Shared Line", entity: "contact", group: "Personal", defaultFieldType: "checkbox", helpText: "Flag for shared retail store phone — affects call strategy" },
  { id: "contact.mobile_phone", label: "Mobile Phone", entity: "contact", group: "Personal", defaultFieldType: "phone" },
  { id: "contact.title", label: "Title", entity: "contact", group: "Personal", defaultFieldType: "text" },

  // ── Role ──────────────────────────────────────────────────────────────────
  { id: "contact.role_labels", label: "Role Labels", entity: "contact", group: "Role", defaultFieldType: "multi_select",
    options: [
      { label: "Owner", value: "owner" },
      { label: "Head Buyer", value: "head_buyer" },
      { label: "Category Buyer", value: "category_buyer" },
      { label: "AP Contact", value: "ap_contact" },
      { label: "Store Manager", value: "store_manager" },
      { label: "Merchandiser", value: "merchandiser" },
      { label: "E-commerce Manager", value: "ecom_manager" },
    ]},
  { id: "contact.categories_buys", label: "Categories Buys", entity: "contact", group: "Role", defaultFieldType: "multi_select",
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Home Decor", value: "home_decor" },
      { label: "Textiles", value: "textiles" },
      { label: "Rugs", value: "rugs" },
      { label: "Outdoor", value: "outdoor" },
      { label: "Gift", value: "gift" },
    ]},
  { id: "contact.buying_seasons", label: "Buying Seasons", entity: "contact", group: "Role", defaultFieldType: "multi_select",
    options: [
      { label: "Spring", value: "spring" },
      { label: "Summer", value: "summer" },
      { label: "Fall", value: "fall" },
      { label: "Winter", value: "winter" },
      { label: "Holiday", value: "holiday" },
    ]},
  { id: "contact.decision_authority", label: "Decision Authority", entity: "contact", group: "Role", defaultFieldType: "select",
    options: [
      { label: "Final", value: "final" },
      { label: "Influencer", value: "influencer" },
      { label: "Gatekeeper", value: "gatekeeper" },
    ]},

  // ── Preferences ───────────────────────────────────────────────────────────
  { id: "contact.preferred_contact", label: "Preferred Contact", entity: "contact", group: "Preferences", defaultFieldType: "select",
    options: [
      { label: "Email", value: "email" },
      { label: "SMS", value: "sms" },
      { label: "WhatsApp", value: "whatsapp" },
      { label: "In Person", value: "in_person" },
    ]},
  { id: "contact.opt_in_email", label: "Opt-In Email", entity: "contact", group: "Preferences", defaultFieldType: "checkbox" },
  { id: "contact.opt_in_sms", label: "Opt-In SMS", entity: "contact", group: "Preferences", defaultFieldType: "checkbox" },
  { id: "contact.last_engaged_date", label: "Last Engaged Date", entity: "contact", group: "Preferences", defaultFieldType: "date" },

  // ── Association ───────────────────────────────────────────────────────────
  { id: "contact.primary_retailer", label: "Retailer", entity: "contact", group: "Association", defaultFieldType: "lookup", lookupEntity: "retailer_account", commonlyUsed: true, helpText: "The contact's primary retailer (1:1 default)" },
  { id: "contact.also_associated_with", label: "Also Associated With", entity: "contact", group: "Association", defaultFieldType: "multi_select", lookupEntity: "retailer_account", helpText: "For contacts that work across multiple retailers — buying-group consultants, designers serving multiple hospitality chains, etc." },
  { id: "contact.store_location", label: "Store Location", entity: "contact", group: "Association", defaultFieldType: "lookup", lookupEntity: "store_location" },

  // ════════════════════════════════════════════════════════════════════════
  // Quote
  // ════════════════════════════════════════════════════════════════════════

  // ── Header ────────────────────────────────────────────────────────────────
  { id: "quote.quote_number", label: "Quote Number", entity: "quote", group: "Header", defaultFieldType: "text" },
  { id: "quote.title", label: "Title", entity: "quote", group: "Header", defaultFieldType: "text", commonlyUsed: true },
  { id: "quote.source", label: "Source", entity: "quote", group: "Header", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "RFQ", value: "rfq" },
      { label: "Sample Follow-up", value: "sample_followup" },
      { label: "Price Match", value: "price_match" },
      { label: "Custom Order", value: "custom_order" },
      { label: "Rep Initiated", value: "rep_initiated" },
    ]},
  { id: "quote.retailer", label: "Retailer", entity: "quote", group: "Header", defaultFieldType: "lookup", lookupEntity: "retailer_account", commonlyUsed: true },
  { id: "quote.contact", label: "Contact", entity: "quote", group: "Header", defaultFieldType: "lookup", lookupEntity: "contact" },
  { id: "quote.rep", label: "Rep", entity: "quote", group: "Header", defaultFieldType: "lookup", lookupEntity: "sales_rep" },
  { id: "quote.trade_show", label: "Trade Show", entity: "quote", group: "Header", defaultFieldType: "lookup", lookupEntity: "trade_show" },
  { id: "quote.price_list_snapshot", label: "Price List Snapshot", entity: "quote", group: "Header", defaultFieldType: "lookup", lookupEntity: "price_list" },
  { id: "quote.quote_date", label: "Quote Date", entity: "quote", group: "Header", defaultFieldType: "date" },
  { id: "quote.expiry_date", label: "Expiry Date", entity: "quote", group: "Header", defaultFieldType: "date", commonlyUsed: true, helpText: "Un-expiring quotes are a common source of pricing disputes" },
  { id: "quote.urgency", label: "Urgency", entity: "quote", group: "Header", defaultFieldType: "select",
    options: [
      { label: "Standard", value: "standard" },
      { label: "Expedited", value: "expedited" },
      { label: "Urgent", value: "urgent" },
    ]},

  // ── Pricing ───────────────────────────────────────────────────────────────
  { id: "quote.subtotal", label: "Subtotal", entity: "quote", group: "Pricing", defaultFieldType: "currency" },
  { id: "quote.discount_total", label: "Discount Total", entity: "quote", group: "Pricing", defaultFieldType: "currency" },
  { id: "quote.freight_estimate", label: "Freight Estimate", entity: "quote", group: "Pricing", defaultFieldType: "currency" },
  { id: "quote.tax_estimate", label: "Tax Estimate", entity: "quote", group: "Pricing", defaultFieldType: "currency" },
  { id: "quote.grand_total", label: "Grand Total", entity: "quote", group: "Pricing", defaultFieldType: "currency", commonlyUsed: true },
  { id: "quote.margin_at_quote", label: "Margin at Quote", entity: "quote", group: "Pricing", defaultFieldType: "percentage" },

  // ── Shipping & Delivery ───────────────────────────────────────────────────
  { id: "quote.shipping_destination", label: "Shipping Destination", entity: "quote", group: "Shipping & Delivery", defaultFieldType: "text" },
  { id: "quote.delivery_date_requested", label: "Delivery Date Requested", entity: "quote", group: "Shipping & Delivery", defaultFieldType: "date" },
  { id: "quote.special_requirements", label: "Special Requirements", entity: "quote", group: "Shipping & Delivery", defaultFieldType: "long_text" },

  // ── Status & Context ──────────────────────────────────────────────────────
  { id: "quote.status", label: "Status", entity: "quote", group: "Status & Context", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Draft", value: "draft" },
      { label: "Sent", value: "sent" },
      { label: "Viewed", value: "viewed" },
      { label: "Accepted", value: "accepted" },
      { label: "Expired", value: "expired" },
      { label: "Rejected", value: "rejected" },
      { label: "Converted to Order", value: "converted_to_order" },
    ]},
  { id: "quote.competitor_context", label: "Competitor Context", entity: "quote", group: "Status & Context", defaultFieldType: "long_text", helpText: "For price-match quotes — document what competitor offered" },
  { id: "quote.attachments", label: "Attachments", entity: "quote", group: "Status & Context", defaultFieldType: "file" },
  { id: "quote.notes", label: "Notes", entity: "quote", group: "Status & Context", defaultFieldType: "long_text" },
  { id: "quote.converted_to_order_id", label: "Converted to Order ID", entity: "quote", group: "Status & Context", defaultFieldType: "text" },

  // ════════════════════════════════════════════════════════════════════════
  // Order
  // ════════════════════════════════════════════════════════════════════════

  // ── Header ────────────────────────────────────────────────────────────────
  { id: "order.order_number", label: "Order Number", entity: "order", group: "Header", defaultFieldType: "text", commonlyUsed: true },
  { id: "order.po_number", label: "PO Number", entity: "order", group: "Header", defaultFieldType: "text", commonlyUsed: true, helpText: "The retailer's Purchase Order number — not our internal order ID" },
  { id: "order.order_type", label: "Order Type", entity: "order", group: "Header", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Opening", value: "opening" },
      { label: "Reorder", value: "reorder" },
      { label: "Fill-In", value: "fill_in" },
      { label: "Show", value: "show" },
      { label: "Drop Ship", value: "drop_ship" },
      { label: "Sample (Complimentary)", value: "sample_complimentary" },
      { label: "Sample (Charged)", value: "sample_charged" },
      { label: "Custom Made-to-Order", value: "custom_made_to_order" },
      { label: "Standing Order Template", value: "standing_order_template" },
      { label: "Standing Order Cycle", value: "standing_order_cycle" },
    ]},
  { id: "order.order_source", label: "Order Source", entity: "order", group: "Header", defaultFieldType: "select",
    options: [
      { label: "In Person", value: "in_person" },
      { label: "Phone", value: "phone" },
      { label: "Email", value: "email" },
      { label: "E-commerce", value: "ecom" },
      { label: "Show", value: "show" },
      { label: "WizAI", value: "wizai" },
      { label: "Quote Conversion", value: "quote_conversion" },
      { label: "Standing Order", value: "standing_order" },
    ]},
  { id: "order.source_quote_id", label: "Source Quote", entity: "order", group: "Header", defaultFieldType: "lookup", lookupEntity: "quote" },
  { id: "order.source_standing_order_id", label: "Source Standing Order", entity: "order", group: "Header", defaultFieldType: "lookup", lookupEntity: "order", helpText: "The standing-order template (order_type = standing_order_template) this cycle was generated from" },
  { id: "order.order_date", label: "Order Date", entity: "order", group: "Header", defaultFieldType: "date" },
  { id: "order.requested_ship_date", label: "Requested Ship Date", entity: "order", group: "Header", defaultFieldType: "date", commonlyUsed: true },
  { id: "order.cancel_after_date", label: "Cancel After Date", entity: "order", group: "Header", defaultFieldType: "date", helpText: "Retailer instruction: cancel the order if it can't ship by this date" },
  { id: "order.ship_complete", label: "Ship Complete", entity: "order", group: "Header", defaultFieldType: "checkbox" },
  { id: "order.payment_terms_snapshot", label: "Payment Terms Snapshot", entity: "order", group: "Header", defaultFieldType: "select",
    options: [
      { label: "COD", value: "COD" },
      { label: "CIA", value: "CIA" },
      { label: "Net 15", value: "Net15" },
      { label: "Net 30", value: "Net30" },
      { label: "Net 45", value: "Net45" },
      { label: "Net 60", value: "Net60" },
      { label: "EOM", value: "EOM" },
    ]},
  { id: "order.payment_method", label: "Payment Method", entity: "order", group: "Header", defaultFieldType: "lookup", lookupEntity: "payment_method" },
  { id: "order.notes", label: "Notes", entity: "order", group: "Header", defaultFieldType: "long_text" },

  // ── Routing ───────────────────────────────────────────────────────────────
  { id: "order.fulfillment_warehouse", label: "Fulfillment Warehouse", entity: "order", group: "Routing", defaultFieldType: "text" },
  { id: "order.ship_to_store_location", label: "Ship-To Store Location", entity: "order", group: "Routing", defaultFieldType: "lookup", lookupEntity: "store_location" },

  // ── Delivery Preferences ──────────────────────────────────────────────────
  { id: "order.delivery_window", label: "Delivery Window", entity: "order", group: "Delivery Preferences", defaultFieldType: "select",
    options: [
      { label: "Morning (8–12)", value: "morning_8_12" },
      { label: "Afternoon (12–5)", value: "afternoon_12_5" },
      { label: "Full Day", value: "full_day" },
      { label: "Before 10", value: "before_10" },
      { label: "After 3", value: "after_3" },
    ]},
  { id: "order.special_requirements", label: "Special Requirements", entity: "order", group: "Delivery Preferences", defaultFieldType: "multi_select",
    options: [
      { label: "Lift Gate", value: "lift_gate" },
      { label: "Inside Delivery", value: "inside_delivery" },
      { label: "White Glove", value: "white_glove" },
      { label: "Loading Dock", value: "loading_dock" },
      { label: "Appointment Required", value: "appointment_required" },
      { label: "Weekend Delivery", value: "weekend_delivery" },
    ]},
  { id: "order.receiving_contact_name", label: "Receiving Contact Name", entity: "order", group: "Delivery Preferences", defaultFieldType: "text" },
  { id: "order.receiving_contact_phone", label: "Receiving Contact Phone", entity: "order", group: "Delivery Preferences", defaultFieldType: "phone" },
  { id: "order.delivery_notes", label: "Delivery Notes", entity: "order", group: "Delivery Preferences", defaultFieldType: "long_text" },

  // ── Recurring Schedule (only when order_type = standing_order_template) ─────
  { id: "order.schedule_frequency", label: "Schedule Frequency", entity: "order", group: "Recurring Schedule", defaultFieldType: "select",
    helpText: "Only relevant when order_type = Standing Order Template",
    options: [
      { label: "Weekly", value: "weekly" },
      { label: "Biweekly", value: "biweekly" },
      { label: "Monthly", value: "monthly" },
      { label: "Quarterly", value: "quarterly" },
      { label: "Seasonal", value: "seasonal" },
    ]},
  { id: "order.schedule_seasonal_months", label: "Schedule Seasonal Months", entity: "order", group: "Recurring Schedule", defaultFieldType: "multi_select",
    helpText: "Only when frequency = Seasonal",
    options: [
      { label: "January", value: "jan" },
      { label: "February", value: "feb" },
      { label: "March", value: "mar" },
      { label: "April", value: "apr" },
      { label: "May", value: "may" },
      { label: "June", value: "jun" },
      { label: "July", value: "jul" },
      { label: "August", value: "aug" },
      { label: "September", value: "sep" },
      { label: "October", value: "oct" },
      { label: "November", value: "nov" },
      { label: "December", value: "dec" },
    ]},
  { id: "order.schedule_start_date", label: "Schedule Start Date", entity: "order", group: "Recurring Schedule", defaultFieldType: "date" },
  { id: "order.schedule_end_date", label: "Schedule End Date", entity: "order", group: "Recurring Schedule", defaultFieldType: "date" },
  { id: "order.schedule_next_run_date", label: "Schedule Next Run Date", entity: "order", group: "Recurring Schedule", defaultFieldType: "date" },
  { id: "order.schedule_mode", label: "Schedule Mode", entity: "order", group: "Recurring Schedule", defaultFieldType: "select",
    options: [
      { label: "Auto-Confirm", value: "auto_confirm" },
      { label: "Review Before Shipping", value: "review_before_shipping" },
    ]},
  { id: "order.schedule_status", label: "Schedule Status", entity: "order", group: "Recurring Schedule", defaultFieldType: "select",
    options: [
      { label: "Active", value: "active" },
      { label: "Paused", value: "paused" },
      { label: "Ended", value: "ended" },
    ]},
  { id: "order.schedule_last_run_order_id", label: "Schedule Last Run Order", entity: "order", group: "Recurring Schedule", defaultFieldType: "lookup", lookupEntity: "order" },

  // ── Sample Details (only when order_type starts with "sample_") ─────────────
  { id: "order.sample_purpose", label: "Sample Purpose", entity: "order", group: "Sample Details", defaultFieldType: "select",
    helpText: "Only relevant when order_type = Sample (Complimentary/Charged)",
    options: [
      { label: "Evaluation", value: "evaluation" },
      { label: "Client Presentation", value: "client_presentation" },
      { label: "Showroom", value: "showroom" },
      { label: "Quality Check", value: "quality_check" },
      { label: "Other", value: "other" },
    ]},
  { id: "order.sample_expected_order_volume_bucket", label: "Sample Expected Order Volume", entity: "order", group: "Sample Details", defaultFieldType: "select",
    options: [
      { label: "Under 50", value: "under_50" },
      { label: "50–200", value: "50_200" },
      { label: "200–1000", value: "200_1000" },
      { label: "Over 1000", value: "over_1000" },
    ]},
  { id: "order.sample_willing_to_pay", label: "Sample Willing to Pay", entity: "order", group: "Sample Details", defaultFieldType: "select",
    options: [
      { label: "Full Price", value: "full_price" },
      { label: "Discounted", value: "discounted" },
      { label: "Complimentary Expected", value: "complimentary_expected" },
    ]},
  { id: "order.sample_return_due_date", label: "Sample Return Due Date", entity: "order", group: "Sample Details", defaultFieldType: "date" },
  { id: "order.sample_status", label: "Sample Status", entity: "order", group: "Sample Details", defaultFieldType: "select",
    options: [
      { label: "Requested", value: "requested" },
      { label: "Approved", value: "approved" },
      { label: "Shipped", value: "shipped" },
      { label: "Received", value: "received" },
      { label: "Converted", value: "converted" },
      { label: "Returned", value: "returned" },
      { label: "Unreturned (Invoiced)", value: "unreturned_invoiced" },
      { label: "Declined", value: "declined" },
    ]},
  { id: "order.sample_converted_to_order_id", label: "Sample Converted to Order", entity: "order", group: "Sample Details", defaultFieldType: "lookup", lookupEntity: "order", helpText: "The eventual production order this sample converted into" },

  // ── Status ────────────────────────────────────────────────────────────────
  { id: "order.status", label: "Status", entity: "order", group: "Status", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Draft", value: "draft" },
      { label: "Submitted", value: "submitted" },
      { label: "Pending Credit", value: "pending_credit" },
      { label: "Approved", value: "approved" },
      { label: "Allocated", value: "allocated" },
      { label: "Design Approved", value: "design_approved" },
      { label: "In Production", value: "in_production" },
      { label: "QC", value: "qc" },
      { label: "Picked", value: "picked" },
      { label: "Ready to Ship", value: "ready_to_ship" },
      { label: "Shipped (Partial)", value: "shipped_partial" },
      { label: "Shipped (Complete)", value: "shipped_complete" },
      { label: "Invoiced", value: "invoiced" },
      { label: "Paid", value: "paid" },
      { label: "Returned", value: "returned" },
      { label: "Void", value: "void" },
    ]},

  // ════════════════════════════════════════════════════════════════════════
  // Credit Application
  // ════════════════════════════════════════════════════════════════════════

  // ── Submission ────────────────────────────────────────────────────────────
  { id: "credit_application.status", label: "Status", entity: "credit_application", group: "Submission", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Draft", value: "draft" },
      { label: "Submitted", value: "submitted" },
      { label: "Under Review", value: "under_review" },
      { label: "Conditional", value: "conditional" },
      { label: "Approved", value: "approved" },
      { label: "Declined", value: "declined" },
      { label: "Expired", value: "expired" },
    ]},
  { id: "credit_application.submission_date", label: "Submission Date", entity: "credit_application", group: "Submission", defaultFieldType: "date" },
  { id: "credit_application.decision_date", label: "Decision Date", entity: "credit_application", group: "Submission", defaultFieldType: "date" },

  // ── Requested Terms ───────────────────────────────────────────────────────
  { id: "credit_application.requested_terms", label: "Requested Terms", entity: "credit_application", group: "Requested Terms", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "COD", value: "COD" },
      { label: "CIA", value: "CIA" },
      { label: "Net 15", value: "Net15" },
      { label: "Net 30", value: "Net30" },
      { label: "Net 45", value: "Net45" },
      { label: "Net 60", value: "Net60" },
      { label: "EOM", value: "EOM" },
    ]},
  { id: "credit_application.requested_limit", label: "Requested Limit", entity: "credit_application", group: "Requested Terms", defaultFieldType: "currency", commonlyUsed: true },
  { id: "credit_application.approved_terms", label: "Approved Terms", entity: "credit_application", group: "Requested Terms", defaultFieldType: "text" },
  { id: "credit_application.approved_limit", label: "Approved Limit", entity: "credit_application", group: "Requested Terms", defaultFieldType: "currency" },

  // ── Identity & Financial ──────────────────────────────────────────────────
  { id: "credit_application.ein", label: "EIN", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text", commonlyUsed: true },
  { id: "credit_application.dnb_score", label: "D&B Score", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text", helpText: "Dun & Bradstreet credit score" },
  { id: "credit_application.bank_name", label: "Bank Name", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text" },
  { id: "credit_application.bank_account_masked", label: "Bank Account (Masked)", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text" },
  { id: "credit_application.bank_contact_name", label: "Bank Contact Name", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text" },
  { id: "credit_application.bank_contact_phone", label: "Bank Contact Phone", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "phone" },
  { id: "credit_application.estimated_monthly_volume", label: "Estimated Monthly Volume", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "currency", commonlyUsed: true },
  { id: "credit_application.personal_guarantee_offered", label: "Personal Guarantee Offered", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "checkbox" },
  { id: "credit_application.authorized_signatory_name", label: "Authorized Signatory Name", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "text" },
  { id: "credit_application.signature_date", label: "Signature Date", entity: "credit_application", group: "Identity & Financial", defaultFieldType: "date" },

  // ── Trade References (repeatable block) ───────────────────────────────────
  { id: "credit_application.trade_ref_company", label: "Trade Ref Company", entity: "credit_application", group: "Trade References", defaultFieldType: "text", helpText: "Repeatable block — add one set of trade reference fields per reference" },
  { id: "credit_application.trade_ref_contact", label: "Trade Ref Contact", entity: "credit_application", group: "Trade References", defaultFieldType: "text", helpText: "Repeatable block — add one set of trade reference fields per reference" },
  { id: "credit_application.trade_ref_phone", label: "Trade Ref Phone", entity: "credit_application", group: "Trade References", defaultFieldType: "phone", helpText: "Repeatable block — add one set of trade reference fields per reference" },
  { id: "credit_application.trade_ref_email", label: "Trade Ref Email", entity: "credit_application", group: "Trade References", defaultFieldType: "email", helpText: "Repeatable block — add one set of trade reference fields per reference" },

  // ── Files ─────────────────────────────────────────────────────────────────
  { id: "credit_application.resale_cert_file", label: "Resale Cert File", entity: "credit_application", group: "Files", defaultFieldType: "file" },

  // ── Decision ──────────────────────────────────────────────────────────────
  { id: "credit_application.decision_by", label: "Decision By", entity: "credit_application", group: "Decision", defaultFieldType: "text" },
  { id: "credit_application.reason_codes", label: "Reason Codes", entity: "credit_application", group: "Decision", defaultFieldType: "text" },

  // ════════════════════════════════════════════════════════════════════════
  // Claim / RMA
  // ════════════════════════════════════════════════════════════════════════

  // ── Header ────────────────────────────────────────────────────────────────
  { id: "claim.claim_number", label: "Claim Number", entity: "claim", group: "Header", defaultFieldType: "text" },
  { id: "claim.retailer", label: "Retailer", entity: "claim", group: "Header", defaultFieldType: "lookup", lookupEntity: "retailer_account", commonlyUsed: true },
  { id: "claim.source_order", label: "Source Order", entity: "claim", group: "Header", defaultFieldType: "lookup", lookupEntity: "order", commonlyUsed: true },
  { id: "claim.source_invoice_number", label: "Source Invoice Number", entity: "claim", group: "Header", defaultFieldType: "text" },
  { id: "claim.claim_type", label: "Claim Type", entity: "claim", group: "Header", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Damaged in Transit", value: "damaged_in_transit" },
      { label: "Wrong Item", value: "wrong_item" },
      { label: "Defective", value: "defective" },
      { label: "Missing Items", value: "missing_items" },
      { label: "Quality Issue", value: "quality_issue" },
      { label: "Other", value: "other" },
    ]},
  { id: "claim.preferred_resolution", label: "Preferred Resolution", entity: "claim", group: "Header", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Replacement", value: "replacement" },
      { label: "Refund", value: "refund" },
      { label: "Credit Memo", value: "credit_memo" },
      { label: "Repair", value: "repair" },
    ]},
  { id: "claim.urgency", label: "Urgency", entity: "claim", group: "Header", defaultFieldType: "select",
    options: [
      { label: "Standard", value: "standard" },
      { label: "Urgent", value: "urgent" },
    ]},
  { id: "claim.status", label: "Status", entity: "claim", group: "Header", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Submitted", value: "submitted" },
      { label: "Under Review", value: "under_review" },
      { label: "Approved", value: "approved" },
      { label: "Denied", value: "denied" },
      { label: "Resolved", value: "resolved" },
    ]},
  { id: "claim.submission_date", label: "Submission Date", entity: "claim", group: "Header", defaultFieldType: "date" },
  { id: "claim.resolution_date", label: "Resolution Date", entity: "claim", group: "Header", defaultFieldType: "date" },
  { id: "claim.total_claim_value", label: "Total Claim Value", entity: "claim", group: "Header", defaultFieldType: "currency" },
  { id: "claim.resolution_notes", label: "Resolution Notes", entity: "claim", group: "Header", defaultFieldType: "long_text" },
  { id: "claim.credit_memo_id", label: "Credit Memo ID", entity: "claim", group: "Header", defaultFieldType: "text" },
  { id: "claim.carrier_claim_filed", label: "Carrier Claim Filed", entity: "claim", group: "Header", defaultFieldType: "checkbox" },

  // ── Claim Line Items (repeatable block) ───────────────────────────────────
  { id: "claim.claim_line_sku", label: "Claim Line SKU", entity: "claim", group: "Claim Line Items", defaultFieldType: "lookup", lookupEntity: "sku", helpText: "Repeatable block — add one set of claim line fields per affected item" },
  { id: "claim.claim_line_qty_affected", label: "Claim Line Qty Affected", entity: "claim", group: "Claim Line Items", defaultFieldType: "number", helpText: "Repeatable block — add one set of claim line fields per affected item" },
  { id: "claim.claim_line_issue_description", label: "Claim Line Issue Description", entity: "claim", group: "Claim Line Items", defaultFieldType: "text", helpText: "Repeatable block — add one set of claim line fields per affected item" },
  { id: "claim.claim_line_photo_evidence", label: "Claim Line Photo Evidence", entity: "claim", group: "Claim Line Items", defaultFieldType: "file", helpText: "Repeatable block — add one set of claim line fields per affected item" },
  { id: "claim.claim_line_resolution_applied", label: "Claim Line Resolution Applied", entity: "claim", group: "Claim Line Items", defaultFieldType: "text", helpText: "Repeatable block — add one set of claim line fields per affected item" },

  // ════════════════════════════════════════════════════════════════════════
  // Trade Show (reference-only — admin-managed master data, not form-creatable)
  // ════════════════════════════════════════════════════════════════════════
  { id: "trade_show.show_name", label: "Show Name", entity: "trade_show", group: "General", defaultFieldType: "select",
    options: [
      { label: "Atlanta Market", value: "atlanta_market" },
      { label: "Las Vegas Market", value: "las_vegas_market" },
      { label: "High Point Market", value: "high_point_market" },
      { label: "NY NOW", value: "ny_now" },
      { label: "Shoppe Object", value: "shoppe_object" },
      { label: "Other", value: "other" },
    ]},
  { id: "trade_show.venue", label: "Venue", entity: "trade_show", group: "General", defaultFieldType: "text" },
  { id: "trade_show.start_date", label: "Start Date", entity: "trade_show", group: "General", defaultFieldType: "date" },
  { id: "trade_show.end_date", label: "End Date", entity: "trade_show", group: "General", defaultFieldType: "date" },
  { id: "trade_show.booth_number", label: "Booth Number", entity: "trade_show", group: "General", defaultFieldType: "text" },
  { id: "trade_show.reps_working", label: "Reps Working", entity: "trade_show", group: "General", defaultFieldType: "multi_select", options: [] },
  { id: "trade_show.total_cost", label: "Total Cost", entity: "trade_show", group: "General", defaultFieldType: "currency" },
  { id: "trade_show.leads_scanned", label: "Leads Scanned", entity: "trade_show", group: "General", defaultFieldType: "number" },
  { id: "trade_show.orders_written_count", label: "Orders Written Count", entity: "trade_show", group: "General", defaultFieldType: "number" },
  { id: "trade_show.gmv_written", label: "GMV Written", entity: "trade_show", group: "General", defaultFieldType: "currency" },
  { id: "trade_show.samples_distributed", label: "Samples Distributed", entity: "trade_show", group: "General", defaultFieldType: "number" },
  { id: "trade_show.follow_up_complete_pct", label: "Follow-Up Complete %", entity: "trade_show", group: "General", defaultFieldType: "percentage" },
  { id: "trade_show.roi_auto_calc", label: "ROI (Auto-Calc)", entity: "trade_show", group: "General", defaultFieldType: "currency" },
  { id: "trade_show.interest_area", label: "Interest Area", entity: "trade_show", group: "General", defaultFieldType: "multi_select",
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Decor", value: "decor" },
      { label: "Textiles", value: "textiles" },
    ]},
  { id: "trade_show.follow_up_preference", label: "Follow-Up Preference", entity: "trade_show", group: "General", defaultFieldType: "select",
    options: [
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "In Person", value: "in_person" },
    ]},

  // ════════════════════════════════════════════════════════════════════════
  // Ticket
  // ════════════════════════════════════════════════════════════════════════
  { id: "ticket.subject", label: "Subject", entity: "ticket", group: "General", defaultFieldType: "text", commonlyUsed: true },
  { id: "ticket.description", label: "Description", entity: "ticket", group: "General", defaultFieldType: "long_text" },
  { id: "ticket.priority", label: "Priority", entity: "ticket", group: "General", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Low", value: "low" },
      { label: "Medium", value: "medium" },
      { label: "High", value: "high" },
      { label: "Urgent", value: "urgent" },
    ]},
  { id: "ticket.type", label: "Type", entity: "ticket", group: "General", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Chargeback Dispute", value: "chargeback_dispute" },
      { label: "Pricing Dispute", value: "pricing_dispute" },
      { label: "Delivery Inquiry", value: "delivery_inquiry" },
      { label: "General", value: "general" },
      { label: "Onboarding Question", value: "onboarding_question" },
    ]},
  { id: "ticket.related_order", label: "Related Order", entity: "ticket", group: "General", defaultFieldType: "lookup", lookupEntity: "order", commonlyUsed: true },
  { id: "ticket.related_sku", label: "Related SKU", entity: "ticket", group: "General", defaultFieldType: "lookup", lookupEntity: "sku" },

  // ════════════════════════════════════════════════════════════════════════
  // Touchpoint (rep-created, relationship-building — split out from Activity)
  // ════════════════════════════════════════════════════════════════════════
  { id: "touchpoint.type", label: "Type", entity: "touchpoint", group: "General", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Visit", value: "visit" },
      { label: "Call", value: "call" },
      { label: "Email", value: "email" },
      { label: "Meeting", value: "meeting" },
      { label: "Note", value: "note" },
      { label: "Showroom Visit", value: "showroom_visit" },
      { label: "Show Booth Conversation", value: "show_booth_conversation" },
      { label: "ABR Meeting", value: "abr_meeting" },
      { label: "Line Sheet Sent", value: "line_sheet_sent" },
    ]},
  { id: "touchpoint.notes", label: "Notes", entity: "touchpoint", group: "General", defaultFieldType: "long_text", commonlyUsed: true },
  { id: "touchpoint.related_retailer", label: "Related Retailer", entity: "touchpoint", group: "General", defaultFieldType: "lookup", lookupEntity: "retailer_account", commonlyUsed: true },
  { id: "touchpoint.related_contact", label: "Related Contact", entity: "touchpoint", group: "General", defaultFieldType: "lookup", lookupEntity: "contact" },
  { id: "touchpoint.related_quote", label: "Related Quote", entity: "touchpoint", group: "General", defaultFieldType: "lookup", lookupEntity: "quote" },
  { id: "touchpoint.related_order", label: "Related Order", entity: "touchpoint", group: "General", defaultFieldType: "lookup", lookupEntity: "order" },
  { id: "touchpoint.location", label: "Location", entity: "touchpoint", group: "General", defaultFieldType: "text", helpText: "For in-person events" },
  { id: "touchpoint.duration_minutes", label: "Duration (minutes)", entity: "touchpoint", group: "General", defaultFieldType: "number" },
  { id: "touchpoint.logged_by", label: "Logged By", entity: "touchpoint", group: "General", defaultFieldType: "lookup", lookupEntity: "sales_rep", helpText: "Auto-populated with the rep who logged the touchpoint" },
  { id: "touchpoint.touchpoint_date", label: "Touchpoint Date", entity: "touchpoint", group: "General", defaultFieldType: "date", commonlyUsed: true },

  // ════════════════════════════════════════════════════════════════════════
  // Campaign Response (system-created, marketing-driven — split out from Activity)
  // ════════════════════════════════════════════════════════════════════════
  { id: "campaign_response.campaign_id", label: "Campaign ID", entity: "campaign_response", group: "General", defaultFieldType: "text" },
  { id: "campaign_response.response_type", label: "Response Type", entity: "campaign_response", group: "General", defaultFieldType: "select", commonlyUsed: true,
    options: [
      { label: "Catalog Drop Sent", value: "catalog_drop_sent" },
      { label: "NPS Survey Sent", value: "nps_survey_sent" },
      { label: "NPS Response Received", value: "nps_response_received" },
      { label: "Post-Purchase Survey Sent", value: "post_purchase_survey_sent" },
      { label: "Post-Purchase Response Received", value: "post_purchase_response_received" },
      { label: "Reorder Reminder Sent", value: "reorder_reminder_sent" },
      { label: "Virtual Showroom Session", value: "virtual_showroom_session" },
    ]},
  { id: "campaign_response.response_data", label: "Response Data", entity: "campaign_response", group: "General", defaultFieldType: "long_text", helpText: "Survey responses, NPS scores, etc." },
  { id: "campaign_response.related_retailer", label: "Related Retailer", entity: "campaign_response", group: "General", defaultFieldType: "lookup", lookupEntity: "retailer_account", commonlyUsed: true },
  { id: "campaign_response.related_order", label: "Related Order", entity: "campaign_response", group: "General", defaultFieldType: "lookup", lookupEntity: "order" },
  { id: "campaign_response.response_date", label: "Response Date", entity: "campaign_response", group: "General", defaultFieldType: "date", commonlyUsed: true },

  // ════════════════════════════════════════════════════════════════════════
  // Sales Rep (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "sales_rep.name", label: "Name", entity: "sales_rep", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sales_rep.email", label: "Email", entity: "sales_rep", group: "General", defaultFieldType: "email", referenceOnly: true },
  { id: "sales_rep.employment_type", label: "Employment Type", entity: "sales_rep", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "W-2", value: "w2" },
      { label: "1099", value: "1099" },
      { label: "Rep Group Member", value: "rep_group_member" },
    ]},
  { id: "sales_rep.rep_group", label: "Rep Group", entity: "sales_rep", group: "General", defaultFieldType: "lookup", lookupEntity: "rep_group", referenceOnly: true },
  { id: "sales_rep.territory", label: "Territory", entity: "sales_rep", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sales_rep.lines_carried", label: "Lines Carried", entity: "sales_rep", group: "General", defaultFieldType: "multi_select", referenceOnly: true,
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Home Decor", value: "home_decor" },
      { label: "Textiles", value: "textiles" },
      { label: "Rugs", value: "rugs" },
      { label: "Outdoor", value: "outdoor" },
      { label: "Gift", value: "gift" },
    ]},
  { id: "sales_rep.commission_rate", label: "Commission Rate", entity: "sales_rep", group: "General", defaultFieldType: "percentage", referenceOnly: true },
  { id: "sales_rep.commission_ytd", label: "Commission YTD", entity: "sales_rep", group: "General", defaultFieldType: "currency", referenceOnly: true },
  { id: "sales_rep.quota", label: "Quota", entity: "sales_rep", group: "General", defaultFieldType: "currency", referenceOnly: true },
  { id: "sales_rep.quota_attainment", label: "Quota Attainment", entity: "sales_rep", group: "General", defaultFieldType: "percentage", referenceOnly: true },

  // ════════════════════════════════════════════════════════════════════════
  // Rep Group (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "rep_group.name", label: "Name", entity: "rep_group", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "rep_group.principal", label: "Principal", entity: "rep_group", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "rep_group.lines_carried", label: "Lines Carried", entity: "rep_group", group: "General", defaultFieldType: "multi_select", referenceOnly: true,
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Home Decor", value: "home_decor" },
      { label: "Textiles", value: "textiles" },
      { label: "Rugs", value: "rugs" },
      { label: "Outdoor", value: "outdoor" },
      { label: "Gift", value: "gift" },
    ]},
  { id: "rep_group.territories_covered", label: "Territories Covered", entity: "rep_group", group: "General", defaultFieldType: "multi_select", referenceOnly: true, options: [] },
  { id: "rep_group.commission_split_default", label: "Commission Split Default", entity: "rep_group", group: "General", defaultFieldType: "percentage", referenceOnly: true },
  { id: "rep_group.contract_terms", label: "Contract Terms", entity: "rep_group", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "rep_group.status", label: "Status", entity: "rep_group", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Inactive", value: "inactive" },
    ]},

  // ════════════════════════════════════════════════════════════════════════
  // Price List (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "price_list.name", label: "Name", entity: "price_list", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "price_list.tier_code", label: "Tier Code", entity: "price_list", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Wholesale", value: "wholesale" },
      { label: "Preferred", value: "preferred" },
      { label: "VIP", value: "vip" },
      { label: "Dealer", value: "dealer" },
      { label: "Contract", value: "contract" },
    ]},
  { id: "price_list.type", label: "Type", entity: "price_list", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Tier", value: "tier" },
      { label: "Account Specific", value: "account_specific" },
      { label: "Category Discount", value: "category_discount" },
      { label: "Volume Break", value: "volume_break" },
      { label: "Contract Pricing", value: "contract_pricing" },
    ]},
  { id: "price_list.effective_date", label: "Effective Date", entity: "price_list", group: "General", defaultFieldType: "date", referenceOnly: true },
  { id: "price_list.expiry_date", label: "Expiry Date", entity: "price_list", group: "General", defaultFieldType: "date", referenceOnly: true },

  // ════════════════════════════════════════════════════════════════════════
  // Payment Method (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "payment_method.type", label: "Type", entity: "payment_method", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "ACH", value: "ach" },
      { label: "Card", value: "card" },
      { label: "Check", value: "check" },
      { label: "Wire", value: "wire" },
    ]},
  { id: "payment_method.last4", label: "Last 4", entity: "payment_method", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "payment_method.brand", label: "Brand", entity: "payment_method", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "payment_method.bank_name", label: "Bank Name", entity: "payment_method", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "payment_method.default", label: "Default", entity: "payment_method", group: "General", defaultFieldType: "checkbox", referenceOnly: true },
  { id: "payment_method.status", label: "Status", entity: "payment_method", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Expired", value: "expired" },
      { label: "Revoked", value: "revoked" },
    ]},
  { id: "payment_method.added_date", label: "Added Date", entity: "payment_method", group: "General", defaultFieldType: "date", referenceOnly: true },
  { id: "payment_method.expiry_date", label: "Expiry Date", entity: "payment_method", group: "General", defaultFieldType: "date", referenceOnly: true },

  // ════════════════════════════════════════════════════════════════════════
  // Store Location (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "store_location.dba", label: "DBA", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.address_street", label: "Address Street", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.address_city", label: "Address City", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.address_state", label: "Address State", entity: "store_location", group: "General", defaultFieldType: "select", referenceOnly: true, options: US_STATES },
  { id: "store_location.address_zip", label: "Address Zip", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.store_manager_contact", label: "Store Manager Contact", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.square_footage", label: "Square Footage", entity: "store_location", group: "General", defaultFieldType: "number", referenceOnly: true },
  { id: "store_location.store_format", label: "Store Format", entity: "store_location", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "store_location.opening_date", label: "Opening Date", entity: "store_location", group: "General", defaultFieldType: "date", referenceOnly: true },
  { id: "store_location.status", label: "Status", entity: "store_location", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Open", value: "open" },
      { label: "Closing", value: "closing" },
      { label: "Closed", value: "closed" },
    ]},
  { id: "store_location.per_door_ytd_sales", label: "Per-Door YTD Sales", entity: "store_location", group: "General", defaultFieldType: "currency", referenceOnly: true },

  // ════════════════════════════════════════════════════════════════════════
  // SKU / Product (reference-only)
  // ════════════════════════════════════════════════════════════════════════
  { id: "sku.sku", label: "SKU", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.parent_style", label: "Parent Style", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.name", label: "Name", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.brand", label: "Brand", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.category", label: "Category", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.season", label: "Season", entity: "sku", group: "General", defaultFieldType: "text", referenceOnly: true },
  { id: "sku.msrp", label: "MSRP", entity: "sku", group: "General", defaultFieldType: "currency", referenceOnly: true },
  { id: "sku.wholesale_price_default", label: "Wholesale Price Default", entity: "sku", group: "General", defaultFieldType: "currency", referenceOnly: true },
  { id: "sku.case_pack", label: "Case Pack", entity: "sku", group: "General", defaultFieldType: "number", referenceOnly: true },
  { id: "sku.moq", label: "MOQ", entity: "sku", group: "General", defaultFieldType: "number", referenceOnly: true, helpText: "Minimum Order Quantity" },
  { id: "sku.status", label: "Status", entity: "sku", group: "General", defaultFieldType: "select", referenceOnly: true,
    options: [
      { label: "Active", value: "active" },
      { label: "Discontinued", value: "discontinued" },
      { label: "NLA", value: "nla" },
      { label: "Preorder", value: "preorder" },
    ]},
];

// ════════════════════════════════════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════════════════════════════════════

export function getPropertiesForEntity(
  entity: EntityType,
  opts?: { commonlyUsed?: boolean }
): CrmPropertySeed[] {
  return CRM_PROPERTIES.filter((p) => {
    if (p.entity !== entity) return false;
    if (opts?.commonlyUsed && !p.commonlyUsed) return false;
    return true;
  });
}

export function getEntityLabel(entity: EntityType): string {
  const group = PROPERTY_GROUPS.find((g) => g.entity === entity);
  if (group) return group.label;
  // Fallback for entities not in PROPERTY_GROUPS (e.g. "custom")
  return entity.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

const ACTION_TO_ENTITY: Record<Exclude<CrmAction, "none">, EntityType> = {
  create_retailer_account: "retailer_account",
  create_contact: "contact",
  create_quote: "quote",
  create_order: "order",
  create_credit_application: "credit_application",
  create_claim: "claim",
  create_ticket: "ticket",
  log_touchpoint: "touchpoint",
  log_campaign_response: "campaign_response",
};

// All selectable CRM actions, in display order (the 13 createable/log actions).
export const CRM_ACTIONS = Object.keys(ACTION_TO_ENTITY) as Exclude<CrmAction, "none">[];

export function entityForAction(action: CrmAction): EntityType | null {
  if (action === "none") return null;
  return ACTION_TO_ENTITY[action];
}

export function getActionLabel(action: CrmAction): string {
  if (action === "none") return "No CRM action";
  if (action === "log_touchpoint") return "Log Touchpoint";
  if (action === "log_campaign_response") return "Log Campaign Response";
  return "Create " + getEntityLabel(ACTION_TO_ENTITY[action]);
}

// Duplicate-matching keys per createable entity. Entities not listed here
// NEVER match — they always create a new record (Quote, Order, Claim, Ticket).
const MATCH_KEYS: Partial<Record<EntityType, string[]>> = {
  retailer_account: ["retailer.ein", "retailer.legal_name"],
  contact: ["contact.email", "contact.phone"],
  credit_application: ["credit_application.ein", "credit_application.status"],
};

export function getDefaultMatchKeys(action: CrmAction): string[] {
  const entity = entityForAction(action);
  if (!entity) return [];
  return MATCH_KEYS[entity] ?? [];
}

export type MatchFoundAction = "link" | "link_update" | "ignore";

// What to do when a duplicate match is found, by entity. Entities that always
// create a new record (no match keys) return undefined.
export function getDefaultMatchFoundAction(action: CrmAction): MatchFoundAction | undefined {
  const entity = entityForAction(action);
  if (entity === "retailer_account" || entity === "contact" || entity === "credit_application") {
    return "link_update";
  }
  return undefined;
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Plain-English summary of the duplicate-matching behavior for a form.
export function getMatchingSummary(action: CrmAction, matchFoundAction?: MatchFoundAction): string {
  const keys = getDefaultMatchKeys(action);
  if (keys.length === 0) return "Always creating a new record (no duplicate matching).";
  const labels = keys.map((k) => CRM_PROPERTIES.find((p) => p.id === k)?.label ?? k);
  const behavior =
    matchFoundAction === "link" ? "link to the existing record"
    : matchFoundAction === "ignore" ? "ignore the match and create a new record"
    : "link and update the existing record";
  return `Matching by ${joinWithAnd(labels)}. If a match is found, ${behavior}.`;
}

// ── Auto-mapping: suggest a catalog property for a form field's label ─────────
// Normalize a label for comparison: lowercase, drop trailing colons/asterisks
// and the qualifier word "your", collapse punctuation/whitespace. We deliberately
// do NOT strip "company" — "Company Name" should stay distinct from "Name" so it
// doesn't wrongly auto-map to "Legal Name".
function normalizeLabel(s: string): string {
  return s
    .toLowerCase()
    .replace(/[:*\s]+$/g, "")
    .replace(/\byour\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function labelSimilarity(a: string, b: string): number {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  const ta = new Set(na.split(" "));
  const tb = new Set(nb.split(" "));
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared++;
  if (shared === 0) return 0;
  const dice = (2 * shared) / (ta.size + tb.size);
  const containment = (shared / Math.min(ta.size, tb.size)) * 0.85;
  return Math.max(dice, containment);
}

const MAPPING_CONFIDENCE_THRESHOLD = 0.7;

// Returns the highest-confidence catalog property for a form field label within
// the given entity, or null if nothing clears the threshold.
export function suggestFieldMapping(
  formFieldLabel: string,
  entity: EntityType,
): { propertyId: string; confidence: number } | null {
  let best: { propertyId: string; confidence: number } | null = null;
  for (const p of getPropertiesForEntity(entity)) {
    const confidence = labelSimilarity(formFieldLabel, p.label);
    if (confidence >= MAPPING_CONFIDENCE_THRESHOLD && (!best || confidence > best.confidence)) {
      best = { propertyId: p.id, confidence };
    }
  }
  return best;
}

// Placeholder options for lookup fields in preview/canvas (no real backend).
const LOOKUP_PLACEHOLDERS: Partial<Record<EntityType, string[]>> = {
  retailer_account: ["Acme Lighting Co.", "Pacific Coast Imports", "Bright Decor LLC"],
  contact: ["Sarah Mills", "Marcus Lin", "Linda Park"],
  sales_rep: ["Sample Rep 1", "Sample Rep 2", "Sample Rep 3"],
  rep_group: ["Southeast Home Group", "West Coast Reps", "Midwest Partners"],
  price_list: ["Wholesale", "Preferred", "VIP"],
  payment_method: ["ACH •••• 4821", "Visa •••• 1004", "Check"],
  store_location: ["Main St. Flagship", "Downtown Annex", "Outlet #3"],
  sku: ["SKU-001 — Modern Pendant", "SKU-002 — Oak Dining Table", "SKU-003 — Linen Throw"],
  quote: ["Q-1042", "Q-1043", "Q-1051"],
  order: ["SO-5001", "SO-5002", "SO-5010"],
  trade_show: ["Atlanta Market", "Las Vegas Market", "High Point Market"],
};

export function getLookupPlaceholders(entity: EntityType): string[] {
  return LOOKUP_PLACEHOLDERS[entity] ?? ["Sample 1", "Sample 2", "Sample 3"];
}

export function entityBadgeClasses(entity: EntityType): string {
  switch (entity) {
    case "retailer_account": return "bg-green-100 text-green-700";
    case "quote":            return "bg-blue-100 text-blue-700";
    case "order":            return "bg-purple-100 text-purple-700";
    case "claim":            return "bg-red-100 text-red-700";
    case "contact":          return "bg-sky-100 text-sky-700";
    case "credit_application": return "bg-orange-100 text-orange-700";
    case "trade_show":       return "bg-pink-100 text-pink-700";
    case "ticket":           return "bg-rose-100 text-rose-700";
    case "touchpoint":       return "bg-slate-100 text-slate-700";
    case "campaign_response": return "bg-cyan-100 text-cyan-700";
    default:                 return "bg-gray-100 text-gray-700";
  }
}
