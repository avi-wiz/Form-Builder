import type { CrmPropertySeed } from "./forms-store";

export type CrmObjectType = "contact" | "company" | "deal" | "custom";
export type CrmProperty = CrmPropertySeed;

export const PROPERTY_GROUPS: { name: string; objectType: CrmObjectType }[] = [
  { name: "Contact Information", objectType: "contact" },
  { name: "Company Information", objectType: "company" },
  { name: "Address", objectType: "contact" },
  { name: "Deal Information", objectType: "deal" },
  { name: "Trade Show", objectType: "custom" },
  { name: "Custom Properties", objectType: "custom" },
];

export const CRM_PROPERTY_CATALOG: CrmProperty[] = [
  // Contact Information
  { id: "contact.first_name", label: "First Name", objectType: "contact", group: "Contact Information", defaultFieldType: "text", commonlyUsed: true },
  { id: "contact.last_name",  label: "Last Name",  objectType: "contact", group: "Contact Information", defaultFieldType: "text", commonlyUsed: true },
  { id: "contact.email",      label: "Email",      objectType: "contact", group: "Contact Information", defaultFieldType: "email", commonlyUsed: true },
  { id: "contact.phone",      label: "Phone",      objectType: "contact", group: "Contact Information", defaultFieldType: "phone", commonlyUsed: true },
  { id: "contact.job_title",  label: "Job Title",  objectType: "contact", group: "Contact Information", defaultFieldType: "text" },
  { id: "contact.linkedin",   label: "LinkedIn URL", objectType: "contact", group: "Contact Information", defaultFieldType: "url" },

  // Company Information
  { id: "company.name",         label: "Company Name", objectType: "company", group: "Company Information", defaultFieldType: "text", commonlyUsed: true },
  { id: "company.display_name", label: "Display Name", objectType: "company", group: "Company Information", defaultFieldType: "text" },
  { id: "company.industry",     label: "Industry",     objectType: "company", group: "Company Information", defaultFieldType: "select",
    options: [
      { label: "Lighting", value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Home Decor", value: "home_decor" },
      { label: "Textiles", value: "textiles" },
      { label: "Other", value: "other" },
    ]},
  { id: "company.size",         label: "Company Size", objectType: "company", group: "Company Information", defaultFieldType: "select",
    options: [
      { label: "1-10", value: "1_10" },
      { label: "11-50", value: "11_50" },
      { label: "51-200", value: "51_200" },
      { label: "201-1000", value: "201_1000" },
      { label: "1000+", value: "1000_plus" },
    ]},
  { id: "company.website",      label: "Website",        objectType: "company", group: "Company Information", defaultFieldType: "url" },
  { id: "company.revenue",      label: "Annual Revenue", objectType: "company", group: "Company Information", defaultFieldType: "currency" },

  // Address
  { id: "contact.street",  label: "Street Address",  objectType: "contact", group: "Address", defaultFieldType: "text" },
  { id: "contact.city",    label: "City",            objectType: "contact", group: "Address", defaultFieldType: "text" },
  { id: "contact.state",   label: "State/Province",  objectType: "contact", group: "Address", defaultFieldType: "text" },
  { id: "contact.zip",     label: "Zip Code",        objectType: "contact", group: "Address", defaultFieldType: "text" },
  { id: "contact.country", label: "Country",         objectType: "contact", group: "Address", defaultFieldType: "text" },

  // Deal Information
  { id: "deal.name",           label: "Deal Name",      objectType: "deal", group: "Deal Information", defaultFieldType: "text" },
  { id: "deal.value",          label: "Deal Value",     objectType: "deal", group: "Deal Information", defaultFieldType: "currency" },
  { id: "deal.close_date",     label: "Close Date",     objectType: "deal", group: "Deal Information", defaultFieldType: "date" },
  { id: "deal.pipeline_stage", label: "Pipeline Stage", objectType: "deal", group: "Deal Information", defaultFieldType: "select",
    options: [
      { label: "Prospecting",  value: "prospecting" },
      { label: "Qualified",    value: "qualified" },
      { label: "Proposal",     value: "proposal" },
      { label: "Closed Won",   value: "closed_won" },
      { label: "Closed Lost",  value: "closed_lost" },
    ]},

  // Trade Show
  { id: "ts.booth_number",  label: "Booth Number",     objectType: "custom", group: "Trade Show", defaultFieldType: "text" },
  { id: "ts.show_name",     label: "Show Name",        objectType: "custom", group: "Trade Show", defaultFieldType: "select",
    options: [
      { label: "Atlanta Market",     value: "atlanta_market" },
      { label: "Las Vegas Market",   value: "las_vegas_market" },
      { label: "High Point Market",  value: "high_point_market" },
    ]},
  { id: "ts.interest_area", label: "Interest Area",    objectType: "custom", group: "Trade Show", defaultFieldType: "multi_select",
    options: [
      { label: "Lighting",  value: "lighting" },
      { label: "Furniture", value: "furniture" },
      { label: "Decor",     value: "decor" },
      { label: "Textiles",  value: "textiles" },
    ]},
  { id: "ts.follow_up",     label: "Follow-Up Preference", objectType: "custom", group: "Trade Show", defaultFieldType: "radio",
    options: [
      { label: "Email",     value: "email" },
      { label: "Phone",     value: "phone" },
      { label: "In Person", value: "in_person" },
    ]},
];

export function objectTypeBadgeClasses(t: CrmObjectType): string {
  switch (t) {
    case "contact": return "bg-blue-100 text-blue-700";
    case "company": return "bg-purple-100 text-purple-700";
    case "deal":    return "bg-orange-100 text-orange-700";
    case "custom":  return "bg-gray-100 text-gray-700";
  }
}

export function objectTypeLabel(t: CrmObjectType): string {
  switch (t) {
    case "contact": return "Contact";
    case "company": return "Company";
    case "deal":    return "Deal";
    case "custom":  return "Custom";
  }
}
