import { createContext, useContext, useState, type ReactNode } from "react";

export type FieldType =
  | "text" | "long_text" | "percentage" | "select" | "multi_select" | "url"
  | "html" | "email" | "number" | "phone" | "checkbox" | "date" | "file"
  | "currency" | "hidden" | "radio" | "rating" | "consent";

export interface FieldOption { label: string; value: string }

export type ConditionOperator = "equals" | "not_equals" | "contains" | "is_blank" | "greater_than" | "less_than";
export interface VisibilityRule { fieldId: string; operator: ConditionOperator; value: string }
export interface VisibilityConditions { logic: "AND" | "OR"; rules: VisibilityRule[] }

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
}

export interface FormSection {
  id: string;
  name: string;
  quickAdd: boolean;
  show: boolean;
  fields: FormField[];
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
  action: "none" | "lead" | "deal" | "lead_deal" | "ticket";
  fieldMap: Record<string, string>;
  defaultLeadStatus: string;
  defaultDealStage?: string;
  duplicateAction?: "update" | "create_anyway" | "skip";
  matchByEmail?: boolean;
  matchByCompany?: boolean;
  matchByPhone?: boolean;
  matchFoundAction?: "link" | "link_update" | "ignore";
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

export interface CustomerRecord {
  id: string;
  name: string;
  code: string;
  email: string;
  pricelist: string;
  salesRep: string;
}

const uid = () => Math.random().toString(36).slice(2, 10);

function defaultBasicDetails(): FormSection {
  return {
    id: uid(), name: "Company Info", quickAdd: true, show: true,
    fields: [
      { id: uid(), displayName: "Company name", type: "text", required: true, included: true, placeholder: "Acme Co." },
      { id: uid(), displayName: "Display name", type: "text", required: false, included: true },
      { id: uid(), displayName: "Email ID", type: "email", required: true, included: true, placeholder: "name@company.com" },
      { id: uid(), displayName: "Phone", type: "phone", required: false, included: true },
    ],
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
      {
        id: uid(), name: "Trade Show Details", quickAdd: false, show: true,
        fields: [
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
        ],
      },
    ],
    afterSubmit: { mode: "message", message: "Thanks! Your rep will follow up shortly.", redirectUrl: "", delay: 3 },
    crm: { action: "lead", fieldMap: {}, defaultLeadStatus: "New" },
    automation: { sendEmail: true, emailTemplate: "Trade Show Follow-Up", notifyTeam: true, notifyTargets: ["John Carmichael"], createTask: true, taskTitle: "Follow up with new trade show lead", taskAssignee: "Auto-assigned rep", taskDue: "+1 day", taskPriority: "High" },
    submissionCount: 47, viewCount: 412,
  };
}

const SEED_FORMS: Form[] = [
  leadCaptureForm(),
  {
    id: "f_contact", name: "Contact Us (Website)", slug: "contact-us",
    description: "Get in touch with our team.",
    status: "published", kind: "Contact",
    createdAt: "2026-01-15", updatedAt: "2026-05-28",
    multiStep: false,
    sections: [
      defaultBasicDetails(),
      { id: uid(), name: "How can we help?", quickAdd: false, show: true,
        fields: [
          { id: uid(), displayName: "Subject", type: "text", required: true, included: true },
          { id: uid(), displayName: "Message", type: "long_text", required: true, included: true, placeholder: "Tell us what you need..." },
          { id: uid(), displayName: "I agree to be contacted", type: "consent", required: true, included: true, consentText: "I agree to the privacy policy and to be contacted.", privacyUrl: "https://example.com/privacy" },
        ]},
    ],
    afterSubmit: { mode: "message", message: "Thanks! We'll be in touch within 1 business day.", redirectUrl: "", delay: 3 },
    crm: { action: "lead", fieldMap: {}, defaultLeadStatus: "New" },
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
      { id: uid(), name: "Product Requirements", quickAdd: false, show: true,
        fields: [
          { id: uid(), displayName: "Product category", type: "select", required: true, included: true,
            options: [
              { label: "Lighting", value: "lighting" },
              { label: "Furniture", value: "furniture" },
              { label: "Home Décor", value: "decor" },
            ]},
          { id: uid(), displayName: "Estimated quantity", type: "number", required: true, included: true },
          { id: uid(), displayName: "Target budget", type: "currency", required: false, included: true },
          { id: uid(), displayName: "Specs / attachment", type: "file", required: false, included: true },
        ]},
      { id: uid(), name: "Timeline", quickAdd: false, show: true,
        fields: [
          { id: uid(), displayName: "Needed by", type: "date", required: true, included: true },
          { id: uid(), displayName: "Notes", type: "long_text", required: false, included: true },
        ]},
    ],
    afterSubmit: { mode: "message", message: "Quote request received. Our team will respond within 2 business days.", redirectUrl: "", delay: 3 },
    crm: { action: "lead_deal", fieldMap: {}, defaultLeadStatus: "Prospect" },
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
    crm: { action: "none", fieldMap: {}, defaultLeadStatus: "New" },
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
      { id: uid(), name: "Your Experience", quickAdd: true, show: true,
        fields: [
          { id: uid(), displayName: "Overall rating", type: "rating", required: true, included: true, ratingScale: 5 },
          { id: uid(), displayName: "What went well?", type: "long_text", required: false, included: true },
          { id: uid(), displayName: "What could be improved?", type: "long_text", required: false, included: true },
          { id: uid(), displayName: "Your email", type: "email", required: false, included: true },
        ]},
    ],
    afterSubmit: { mode: "message", message: "Thanks for your feedback!", redirectUrl: "", delay: 3 },
    crm: { action: "none", fieldMap: {}, defaultLeadStatus: "New" },
    automation: { sendEmail: false, emailTemplate: "General Acknowledgement", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Low" },
    submissionCount: 89, viewCount: 642,
  },
];

const SEED_CUSTOMERS: CustomerRecord[] = [
  { id: "C_01396", name: "Flash Furnishing", code: "C_01396", email: "abinv@gmail.com", pricelist: "WholeSale Price", salesRep: "Internal" },
  { id: "C_01200", name: "Madison Creek Furnishings", code: "C_01200", email: "ops@madisoncreek.com", pricelist: "WholeSale Price", salesRep: "John Carmichael" },
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
      { id: "n1", type: "entry", label: "Form Submission", x: 40, y: 200, config: { entity: "Forms", formId: "f_trade_show" } },
      { id: "n2", type: "condition", label: "If Lead Source = 'Trade Show'", x: 300, y: 200, config: { field: "Lead Source", operator: "equals", value: "Trade Show" } },
      { id: "n3", type: "action", label: "Assign Rep (round-robin)", x: 600, y: 80, config: { assignMode: "round-robin" } },
      { id: "n4", type: "action", label: "Create Task", x: 860, y: 80 },
      { id: "n5", type: "action", label: "Send Notification", x: 1120, y: 80 },
      { id: "n6", type: "action", label: "Create Lead", x: 600, y: 320 },
      { id: "n7", type: "action", label: "Send Notification", x: 860, y: 320 },
    ],
    edges: [
      { from: "n1", to: "n2" },
      { from: "n2", to: "n3", branch: "true" },
      { from: "n3", to: "n4" },
      { from: "n4", to: "n5" },
      { from: "n2", to: "n6", branch: "false" },
      { from: "n6", to: "n7" },
    ]},
];

interface StoreCtx {
  forms: Form[];
  submissions: Submission[];
  customers: CustomerRecord[];
  workflows: Workflow[];
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
  addField: (formId: string, sectionId: string, field: FormField) => void;
  updateField: (formId: string, sectionId: string, fieldId: string, patch: Partial<FormField>) => void;
  removeField: (formId: string, sectionId: string, fieldId: string) => void;
  moveField: (formId: string, fromSection: string, toSection: string, fieldId: string, toIndex: number) => void;
  addSubmission: (s: Submission) => void;
  updateSubmission: (id: string, patch: Partial<Submission>) => void;
  updateWorkflow: (id: string, patch: Partial<Workflow>) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

export function FormsStoreProvider({ children }: { children: ReactNode }) {
  const [forms, setForms] = useState<Form[]>(SEED_FORMS);
  const [submissions, setSubmissions] = useState<Submission[]>(SEED_SUBMISSIONS);
  const [customers] = useState<CustomerRecord[]>(SEED_CUSTOMERS);
  const [workflows, setWorkflows] = useState<Workflow[]>(SEED_WORKFLOWS);

  const today = new Date().toISOString().slice(0, 10);

  const value: StoreCtx = {
    forms, submissions, customers, workflows,
    getForm: (id) => forms.find((f) => f.id === id),
    createForm: () => {
      const f: Form = {
        id: "f_" + uid(), name: "Untitled Form", slug: "untitled-" + uid(),
        description: "", status: "draft", kind: "Custom",
        createdAt: today, updatedAt: today,
        multiStep: false,
        sections: [defaultBasicDetails()],
        afterSubmit: { mode: "message", message: "Thank you! Your submission has been received.", redirectUrl: "", delay: 3 },
        crm: { action: "none", fieldMap: {}, defaultLeadStatus: "New" },
        automation: { sendEmail: false, emailTemplate: "Thank You", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
        submissionCount: 0, viewCount: 0,
      };
      setForms((p) => [f, ...p]);
      return f;
    },
    updateForm: (id, patch) => setForms((p) => p.map((f) => f.id === id ? { ...f, ...patch, updatedAt: today } : f)),
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
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.map((s) => s.id === sectionId ? { ...s, ...patch } : s) } : f)),
    reorderSections: (formId, ids) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        const map = new Map(f.sections.map((s) => [s.id, s]));
        return { ...f, sections: ids.map((i) => map.get(i)!).filter(Boolean) };
      })),
    addSection: (formId) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: [...f.sections, { id: uid(), name: "New Section", quickAdd: false, show: true, fields: [] }] } : f)),
    removeSection: (formId, sectionId) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.filter((s) => s.id !== sectionId) } : f)),
    addField: (formId, sectionId, field) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.map((s) => s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s) } : f)),
    updateField: (formId, sectionId, fieldId, patch) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.map((s) => s.id === sectionId ? { ...s, fields: s.fields.map((fl) => fl.id === fieldId ? { ...fl, ...patch } : fl) } : s) } : f)),
    removeField: (formId, sectionId, fieldId) =>
      setForms((p) => p.map((f) => f.id === formId ? { ...f, sections: f.sections.map((s) => s.id === sectionId ? { ...s, fields: s.fields.filter((fl) => fl.id !== fieldId) } : s) } : f)),
    moveField: (formId, fromSec, toSec, fieldId, toIndex) =>
      setForms((p) => p.map((f) => {
        if (f.id !== formId) return f;
        let moving: FormField | undefined;
        const cleared = f.sections.map((s) => {
          if (s.id !== fromSec) return s;
          const idx = s.fields.findIndex((fl) => fl.id === fieldId);
          if (idx < 0) return s;
          moving = s.fields[idx];
          return { ...s, fields: s.fields.filter((_, i) => i !== idx) };
        });
        if (!moving) return f;
        const final = cleared.map((s) => {
          if (s.id !== toSec) return s;
          const nf = [...s.fields];
          nf.splice(Math.max(0, Math.min(toIndex, nf.length)), 0, moving!);
          return { ...s, fields: nf };
        });
        return { ...f, sections: final };
      })),
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
};

export const newField = (type: FieldType, displayName: string): FormField => ({
  id: uid(), displayName, type, required: false, included: true,
  ...(type === "select" || type === "multi_select" || type === "radio"
    ? { options: [{ label: "Option 1", value: "opt1" }, { label: "Option 2", value: "opt2" }] }
    : {}),
  ...(type === "rating" ? { ratingScale: 5 as const } : {}),
  ...(type === "consent" ? { consentText: "I agree to the terms and privacy policy.", privacyUrl: "" } : {}),
});
