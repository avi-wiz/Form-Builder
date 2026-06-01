import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Plus, GripVertical, Eye, EyeOff, Trash2, Sparkles, Settings, SlidersHorizontal, X, ChevronDown, ChevronRight, Palette, Shield, Share2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, Toggle, SlideOver, Toast, DragHandle } from "@/components/ui-kit";
import { useStore, FIELD_TYPE_META, newField, DEFAULT_FORM_STYLE, DEFAULT_GOVERNANCE, type FieldType, type FormField, type ConditionOperator, type VisibilityConditions, type FormStyle, type FormGovernance, type RoleName, type RolePermissions, type Form } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/builder/$formId")({
  head: ({ params }) => ({ meta: [{ title: `Builder · ${params.formId}` }] }),
  component: Builder,
});

const uid = () => Math.random().toString(36).slice(2, 10);

function buildAtlantaSnapshot(): Partial<Form> {
  const companyInfoId = uid();
  const tradeShowDetailsId = uid();
  const companyNameId = uid();
  const contactEmailId = uid();
  const interestAreaId = uid();
  const budgetRangeId = uid();

  return {
    name: "Atlanta Market Lead Capture",
    slug: "atlanta-market-lead-capture",
    description: "Capture leads at the Atlanta Market trade show.",
    status: "published",
    kind: "Lead Capture",
    multiStep: false,
    style: DEFAULT_FORM_STYLE,
    governance: DEFAULT_GOVERNANCE,
    sections: [
      {
        id: companyInfoId,
        name: "Company Info",
        quickAdd: true,
        show: true,
        fields: [
          {
            id: companyNameId,
            displayName: "Company Name",
            type: "text",
            required: true,
            included: true,
            placeholder: "Enter company name",
            helpText: "Legal name of the business",
          },
          {
            id: contactEmailId,
            displayName: "Contact Email",
            type: "email",
            required: true,
            included: true,
          },
          {
            id: interestAreaId,
            displayName: "Interest Area",
            type: "select",
            required: false,
            included: true,
            options: [
              { label: "Furniture", value: "furniture" },
              { label: "Lighting", value: "lighting" },
              { label: "Textiles", value: "textiles" },
            ],
            defaultValue: "lighting",
          },
          {
            id: budgetRangeId,
            displayName: "Budget Range",
            type: "currency",
            required: false,
            included: true,
            conditions: {
              logic: "AND",
              rules: [{ fieldId: interestAreaId, operator: "equals", value: "lighting" }],
            },
          },
          {
            id: uid(),
            displayName: "Notes",
            type: "long_text",
            required: false,
            included: true,
          },
          {
            id: uid(),
            displayName: "UTM Source",
            type: "hidden",
            required: false,
            included: true,
            captureFromUrl: true,
            urlParamName: "utm_source",
            defaultValue: "tradeshow",
          },
        ],
      },
      {
        id: tradeShowDetailsId,
        name: "Trade Show Details",
        quickAdd: false,
        show: true,
        fields: [
          {
            id: uid(),
            displayName: "Marketing Consent",
            type: "consent",
            required: false,
            included: true,
            consentText: "I agree to receive communications from WizCommerce",
            privacyUrl: "https://wizcommerce.com/privacy",
          },
          {
            id: uid(),
            displayName: "Follow-Up Preference",
            type: "radio",
            required: false,
            included: true,
            options: [
              { label: "Email", value: "email" },
              { label: "Phone Call", value: "phone_call" },
              { label: "No Follow-Up", value: "no_follow_up" },
            ],
          },
          {
            id: uid(),
            displayName: "Experience Rating",
            type: "rating",
            required: false,
            included: true,
            ratingScale: 5,
          },
        ],
      },
    ],
    afterSubmit: {
      mode: "message",
      message: "Thanks for visiting our booth! We'll follow up within 24 hours.",
      redirectUrl: "https://wizcommerce.com/thank-you",
      delay: 5,
    },
    crm: {
      action: "lead",
      fieldMap: {
        [companyNameId]: "lead_name",
        [contactEmailId]: "email",
        [interestAreaId]: "lead_source",
      },
      defaultLeadStatus: "New",
    },
    automation: {
      sendEmail: true,
      emailTemplate: "Trade Show Follow-Up",
      notifyTeam: true,
      notifyTargets: ["Sales Manager"],
      createTask: true,
      taskTitle: "Follow up with {{Company Name}}",
      taskAssignee: "Round-Robin",
      taskDue: "+2 days",
      taskPriority: "High",
      kaiDedup: true,
    },
  };
}

type Tab = "field" | "form" | "style" | "settings";

type DragItem =
  | { kind: "section"; id: string }
  | { kind: "field"; sectionId: string; id: string };

function Builder() {
  const { formId } = Route.useParams();
  const store = useStore();
  const navigate = useNavigate();
  const form = store.getForm(formId);
  const [selected, setSelected] = useState<{ sectionId: string; fieldId: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [tab, setTab] = useState<Tab>("field");
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const toggleDemoMode = (on: boolean) => {
    setDemoMode(on);
    setSelected(null);
    setAdding(null);
    if (on) {
      store.updateForm(formId, buildAtlantaSnapshot());
      setToast("Demo mode ON — form configured through PB-02");
    } else {
      store.updateForm(formId, {
        name: "Untitled Form",
        slug: "untitled",
        description: "",
        status: "draft",
        kind: "Custom",
        multiStep: false,
        sections: [
          {
            id: uid(),
            name: "Company Info",
            quickAdd: true,
            show: true,
            fields: [],
          },
        ],
        afterSubmit: { mode: "message", message: "Thank you! Your submission has been received.", redirectUrl: "", delay: 3 },
        crm: { action: "none", fieldMap: {}, defaultLeadStatus: "New" },
        automation: { sendEmail: false, emailTemplate: "Thank You", notifyTeam: false, notifyTargets: [], createTask: false, taskTitle: "", taskAssignee: "", taskDue: "+1 day", taskPriority: "Medium" },
      });
      setToast("Demo mode OFF — form reset to default new state");
    }
  };

  const handleSectionDrop = (targetSectionId: string) => {
    if (!form || !drag || drag.kind !== "section" || drag.id === targetSectionId) return;
    const ids = form.sections.map((s) => s.id);
    const from = ids.indexOf(drag.id);
    const to = ids.indexOf(targetSectionId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, drag.id);
    store.reorderSections(form.id, ids);
  };

  const handleFieldDrop = (targetSectionId: string, targetFieldId: string | null) => {
    if (!form || !drag || drag.kind !== "field") return;
    const targetSection = form.sections.find((s) => s.id === targetSectionId);
    if (!targetSection) return;
    let toIndex = targetFieldId
      ? targetSection.fields.findIndex((f) => f.id === targetFieldId)
      : targetSection.fields.length;
    if (toIndex < 0) toIndex = targetSection.fields.length;
    if (drag.sectionId === targetSectionId) {
      const fromIndex = targetSection.fields.findIndex((f) => f.id === drag.id);
      if (fromIndex === toIndex || fromIndex === toIndex - 1 && fromIndex >= 0) return;
      if (fromIndex < toIndex) toIndex -= 1;
    }
    store.moveField(form.id, drag.sectionId, targetSectionId, drag.id, toIndex);
  };

  if (!form) {
    return (
      <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: "Not found" }]}>
        <div className="p-8 text-center text-muted-foreground">Form not found. <Link to="/forms" className="text-primary">Back to Forms</Link></div>
      </AppShell>
    );
  }

  const selectedField: FormField | null = selected
    ? form.sections.find((s) => s.id === selected.sectionId)?.fields.find((f) => f.id === selected.fieldId) ?? null
    : null;

  // Panel content key drives the cross-fade animation
  const panelKey =
    tab === "form" ? "form-settings"
    : tab === "style" ? "style"
    : tab === "settings" ? "governance"
    : selectedField ? `field-${selectedField.id}`
    : "after-submit";
  const style: FormStyle = form.style ?? DEFAULT_FORM_STYLE;
  const fontStack =
    style.fontFamily === "Inter" ? "Inter, system-ui, sans-serif" :
    style.fontFamily === "Roboto" ? "Roboto, system-ui, sans-serif" :
    style.fontFamily === "Open Sans" ? '"Open Sans", system-ui, sans-serif' :
    "system-ui, -apple-system, sans-serif";

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }]}>
      <div className="flex h-full">
        {/* Left: Sections */}
        <aside className="w-60 shrink-0 border-r border-border bg-card p-4">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sections</div>
          <ul className="space-y-1">
            {form.sections.map((s) => {
              const overKey = "sec-l-" + s.id;
              return (
                <li
                  key={s.id}
                  onDragOver={(e) => { if (drag?.kind === "section") { e.preventDefault(); setDragOver(overKey); } }}
                  onDragLeave={() => setDragOver((d) => (d === overKey ? null : d))}
                  onDrop={(e) => { e.preventDefault(); handleSectionDrop(s.id); setDragOver(null); setDrag(null); }}
                  className={"group flex items-center gap-2 rounded-md p-2 hover:bg-muted " + (dragOver === overKey ? "ring-2 ring-primary/40" : "")}
                >
                  <span
                    draggable
                    onDragStart={(e) => { setDrag({ kind: "section", id: s.id }); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDrag(null); setDragOver(null); }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <DragHandle />
                  </span>
                  <a href={`#sec-${s.id}`} className="flex-1 truncate text-sm">{s.name}</a>
                  <Toggle checked={s.show} onChange={(v) => store.updateSection(form.id, s.id, { show: v })} label="Show" />
                </li>
              );
            })}
          </ul>
          <button onClick={() => store.addSection(form.id)} className="mt-3 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <Plus className="h-4 w-4" /> Add Section
          </button>
        </aside>

        {/* Center: Canvas */}
        <div className="min-w-0 flex-1 overflow-auto">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate({ to: "/forms" })} className="rounded p-1 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
              <input
                value={form.name}
                onChange={(e) => store.updateForm(form.id, { name: e.target.value })}
                className="border-none bg-transparent text-lg font-semibold focus:outline-none"
              />
              <Badge tone={form.status === "published" ? "primary" : "outline"}>{form.status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted">
                <span className={demoMode ? "text-primary" : "text-muted-foreground"}>Demo: PB-02</span>
                <Toggle checked={demoMode} onChange={toggleDemoMode} />
              </label>
              <Btn variant="outline" onClick={() => navigate({ to: "/forms/$formId/share", params: { formId: form.id } })}>
                <Share2 className="h-4 w-4" /> Share
              </Btn>
              <Btn variant="outline" onClick={() => navigate({ to: "/forms/preview/$formId", params: { formId: form.id } })}>
                <Eye className="h-4 w-4" /> Preview
              </Btn>
              <Btn onClick={() => { store.updateForm(form.id, { status: form.status === "published" ? "draft" : "published" }); setToast(form.status === "published" ? "Form unpublished" : "Form published"); }}>
                {form.status === "published" ? "Unpublish" : "Publish"}
              </Btn>
            </div>
          </div>

          <div className="mx-auto max-w-4xl space-y-6 p-6" style={{ fontFamily: fontStack }}>
            {form.sections.map((s) => {
              const secOverKey = "sec-c-" + s.id;
              return (
              <div
                key={s.id}
                id={`sec-${s.id}`}
                onDragOver={(e) => { if (drag?.kind === "section") { e.preventDefault(); setDragOver(secOverKey); } }}
                onDragLeave={() => setDragOver((d) => (d === secOverKey ? null : d))}
                onDrop={(e) => { if (drag?.kind === "section") { e.preventDefault(); handleSectionDrop(s.id); setDragOver(null); setDrag(null); } }}
                className={"border bg-card " + (dragOver === secOverKey ? "border-primary" : "border-border")}
                style={{ borderRadius: 12 }}
              >
                <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                  <span
                    draggable
                    onDragStart={(e) => { setDrag({ kind: "section", id: s.id }); e.dataTransfer.effectAllowed = "move"; }}
                    onDragEnd={() => { setDrag(null); setDragOver(null); }}
                    className="cursor-grab active:cursor-grabbing"
                    title="Drag to reorder section"
                  >
                    <DragHandle />
                  </span>
                  <input
                    value={s.name}
                    onChange={(e) => store.updateSection(form.id, s.id, { name: e.target.value })}
                    className="flex-1 border-none bg-transparent text-base font-semibold focus:outline-none"
                  />
                  <span className="text-xs text-muted-foreground">Quick Add</span>
                  <Toggle checked={s.quickAdd} onChange={(v) => store.updateSection(form.id, s.id, { quickAdd: v })} />
                  <span className="text-xs text-muted-foreground">Show</span>
                  <Toggle checked={s.show} onChange={(v) => store.updateSection(form.id, s.id, { show: v })} />
                </div>
                <div
                  className={"grid grid-cols-1 gap-3 p-5 md:grid-cols-2 rounded-b-xl transition-colors " + (dragOver === "sec-drop-" + s.id ? "bg-primary/5 ring-2 ring-inset ring-primary/30" : "")}
                  onDragOver={(e) => { if (drag?.kind === "field") { e.preventDefault(); setDragOver("sec-drop-" + s.id); } }}
                  onDragLeave={(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver((d) => d === "sec-drop-" + s.id ? null : d); }}
                  onDrop={(e) => { if (drag?.kind === "field") { e.preventDefault(); handleFieldDrop(s.id, null); setDragOver(null); setDrag(null); } }}
                >
                  {s.fields.map((f) => (
                    <div
                      key={f.id}
                      draggable
                      onDragStart={(e) => { setDrag({ kind: "field", sectionId: s.id, id: f.id }); e.dataTransfer.effectAllowed = "move"; e.stopPropagation(); }}
                      onDragEnd={() => { setDrag(null); setDragOver(null); }}
                      onDragOver={(e) => { if (drag?.kind === "field") { e.preventDefault(); e.stopPropagation(); setDragOver("fld-" + f.id); } }}
                      onDragLeave={(e) => { if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) setDragOver((d) => d === "fld-" + f.id ? null : d); }}
                      onDrop={(e) => { if (drag?.kind === "field") { e.preventDefault(); e.stopPropagation(); handleFieldDrop(s.id, f.id); setDragOver(null); setDrag(null); } }}
                      onClick={() => { setSelected({ sectionId: s.id, fieldId: f.id }); setTab("field"); setAdding(null); }}
                      className={"group relative flex cursor-grab items-start gap-2 border p-3 text-left transition-all hover:border-primary/50 active:cursor-grabbing " + (f.type === "hidden" ? "border-dashed bg-muted/30" : "bg-background") + " " + (dragOver === "fld-" + f.id ? "ring-2 ring-primary/40" : "")}
                      style={{
                        borderRadius: style.fieldRadius,
                        borderColor: selected?.fieldId === f.id ? style.primaryColor : f.type === "hidden" ? "#9CA3AF" : undefined,
                        boxShadow: selected?.fieldId === f.id ? `0 0 0 2px ${style.primaryColor}33` : undefined,
                      }}
                    >
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {f.type === "hidden" && <EyeOff className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                          <span className="truncate text-sm font-medium text-muted-foreground">{f.displayName}{f.required && <span className="text-destructive"> *</span>}</span>
                          <Badge tone="outline">{FIELD_TYPE_META[f.type].label}</Badge>
                          {f.captureFromUrl && f.urlParamName && (
                            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                              ?{f.urlParamName}
                            </span>
                          )}
                          {f.conditions && f.conditions.rules.length > 0 && (
                            <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                              Conditions
                            </span>
                          )}
                        </div>
                        {f.type !== "hidden" && f.type !== "consent" && f.placeholder && <div className="mt-1 truncate text-xs text-muted-foreground">{f.placeholder}</div>}
                        {f.type === "consent" && f.consentText && (
                          <div className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                            <input type="checkbox" className="mt-0.5 h-3 w-3 shrink-0" disabled />
                            <span className="line-clamp-2">
                              {f.consentText}{" "}
                              {f.privacyUrl && <span className="text-primary underline">Privacy policy</span>}
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); store.removeField(form.id, s.id, f.id); if (selected?.fieldId === f.id) setSelected(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); store.removeField(form.id, s.id, f.id); } }}
                        className="hidden rounded p-1 hover:bg-muted group-hover:inline-flex"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border px-5 py-2">
                  <button onClick={() => { setAdding(s.id); }} className="flex items-center gap-1 text-sm font-medium hover:underline" style={{ color: style.primaryColor }}>
                    <Plus className="h-4 w-4" /> Add Field
                  </button>
                </div>
              </div>
              );
            })}
            {/* Submit button preview — reflects style settings */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                className="px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: style.buttonColor, borderRadius: style.buttonRadius }}
              >
                {style.submitText || "Submit"}
              </button>
            </div>
          </div>
        </div>


        {/* Right: animated tabbed settings panel */}
        <aside className="hidden shrink-0 overflow-hidden border-l border-border bg-card transition-all duration-300 ease-out lg:block" style={{ width: 360 }}>
          <div className="flex h-full flex-col">
            {/* Tab bar */}
            <div className="flex items-center gap-1 border-b border-border px-3 pt-3">
              <TabBtn active={tab === "field"} onClick={() => setTab("field")} icon={<SlidersHorizontal className="h-3.5 w-3.5" />}>
                {selectedField ? "Field" : "After Submit"}
              </TabBtn>
              <TabBtn active={tab === "form"} onClick={() => { setTab("form"); }} icon={<Settings className="h-3.5 w-3.5" />}>
                Form Settings
              </TabBtn>
              <TabBtn active={tab === "style"} onClick={() => { setTab("style"); }} icon={<Palette className="h-3.5 w-3.5" />}>
                Styling
              </TabBtn>
              <TabBtn active={tab === "settings"} onClick={() => { setTab("settings"); }} icon={<Shield className="h-3.5 w-3.5" />}>
                Settings
              </TabBtn>
              {selectedField && tab === "field" && (
                <button onClick={() => setSelected(null)} className="ml-auto rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Deselect field">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Animated content */}
            <div key={panelKey} className="min-h-0 flex-1 animate-fade-in overflow-auto p-5">
              {tab === "form" && <FormSettingsPanel form={form} />}
              {tab === "style" && <StylePanel form={form} />}
              {tab === "settings" && <GovernancePanel form={form} />}
              {tab === "field" && selectedField && selected && <FieldEditPanel formId={form.id} sectionId={selected.sectionId} field={selectedField} allFields={form.sections.flatMap((s) => s.fields.filter((x) => x.id !== selectedField.id).map((x) => ({ id: x.id, name: x.displayName })))} />}
              {tab === "field" && !selectedField && <AfterSubmitPanel form={form} />}
            </div>
          </div>
        </aside>
      </div>

      {/* Add Field slide-over (kept for "+Add Field" action) */}
      <SlideOver open={!!adding} onClose={() => setAdding(null)} title="Add Field"
        footer={<div className="flex justify-end gap-2"><Btn variant="outline" onClick={() => setAdding(null)}>Cancel</Btn></div>}>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(FIELD_TYPE_META) as FieldType[]).map((t) => (
            <button key={t} onClick={() => {
              if (!adding) return;
              const f = newField(t, FIELD_TYPE_META[t].label);
              store.addField(form.id, adding, f);
              const sid = adding;
              setAdding(null);
              setSelected({ sectionId: sid, fieldId: f.id });
              setTab("field");
            }}
              className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:bg-primary/5">
              {FIELD_TYPE_META[t].label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Click a type to add it to the section.</p>
      </SlideOver>

      <Toast open={!!toast} onClose={() => setToast("")} message={toast} />
    </AppShell>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {icon}{children}
    </button>
  );
}

function FormSettingsPanel({ form }: { form: ReturnType<typeof useStore>["forms"][number] }) {
  const store = useStore();
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Settings className="h-4 w-4 text-primary" /> Form Settings</div>
      <Field label="Form Name">
        <input value={form.name} onChange={(e) => store.updateForm(form.id, { name: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </Field>
      <Field label="Description">
        <textarea value={form.description} onChange={(e) => store.updateForm(form.id, { description: e.target.value })} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </Field>
      <Field label="Status">
        <select value={form.status} onChange={(e) => store.updateForm(form.id, { status: e.target.value as never })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </Field>
      <Field label="Type">
        <select value={form.kind} onChange={(e) => store.updateForm(form.id, { kind: e.target.value as never })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
          {["Lead Capture", "Contact", "RFQ", "Custom"].map((k) => <option key={k}>{k}</option>)}
        </select>
      </Field>
      <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-muted/40 p-3">
        <div>
          <div className="text-sm font-medium">Multi-Step Wizard</div>
          <div className="text-xs text-muted-foreground">Render each section as its own step</div>
        </div>
        <Toggle checked={form.multiStep} onChange={(v) => store.updateForm(form.id, { multiStep: v })} />
      </div>
      <div className="mt-4 border-t border-border pt-4 space-y-2">
        <Link to="/forms/$formId/submissions" params={{ formId: form.id }} className="block text-sm text-primary hover:underline">View submissions →</Link>
        <Link to="/forms/$formId/share" params={{ formId: form.id }} className="block text-sm text-primary hover:underline">Share & embed →</Link>
        <Link to="/forms/$formId/analytics" params={{ formId: form.id }} className="block text-sm text-primary hover:underline">Analytics →</Link>
      </div>
    </div>
  );
}

function AfterSubmitPanel({ form }: { form: ReturnType<typeof useStore>["forms"][number] }) {
  const store = useStore();
  const [contactMatchOpen, setContactMatchOpen] = useState(false);
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-kai" /> After Submission</div>
      <p className="mb-3 text-xs text-muted-foreground">Select a field on the canvas to edit it, or configure post-submit behavior here.</p>
      <Field label="Behavior">
        <div className="space-y-2">
          {[
            { v: "message", label: "Show thank-you message" },
            { v: "redirect", label: "Redirect to URL" },
            { v: "both", label: "Message then redirect" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="aftermode" checked={form.afterSubmit.mode === (o.v as never)} onChange={() => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, mode: o.v as never } })} />
              {o.label}
            </label>
          ))}
        </div>
      </Field>
      {(form.afterSubmit.mode === "message" || form.afterSubmit.mode === "both") && (
        <Field label="Thank-you message">
          <textarea value={form.afterSubmit.message} onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, message: e.target.value } })} rows={3} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </Field>
      )}
      {form.afterSubmit.mode === "both" && (
        <Field label={`Redirect delay — ${form.afterSubmit.delay ?? 3}s`}>
          <input
            type="range"
            min={2}
            max={10}
            step={1}
            value={form.afterSubmit.delay ?? 3}
            onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, delay: Number(e.target.value) } })}
            className="w-full accent-primary"
          />
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>2s</span><span>10s</span>
          </div>
        </Field>
      )}
      {(form.afterSubmit.mode === "redirect" || form.afterSubmit.mode === "both") && (
        <Field label="Redirect URL">
          <input value={form.afterSubmit.redirectUrl} onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, redirectUrl: e.target.value } })} placeholder="https://…" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </Field>
      )}
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 text-sm font-semibold">CRM Action</div>
        <select value={form.crm.action} onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, action: e.target.value as never } })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
          <option value="none">Do nothing</option>
          <option value="lead">Create Lead</option>
          <option value="deal">Create Deal</option>
          <option value="lead_deal">Create Lead + Deal</option>
          <option value="ticket">Create Support Ticket</option>
        </select>

        {form.crm.action !== "none" && (
          <div className="mt-3 space-y-1.5">
            <label className="block text-xs font-medium text-muted-foreground">If a record with this email already exists:</label>
            <select
              value={form.crm.duplicateAction ?? "update"}
              onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, duplicateAction: e.target.value as never } })}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="update">Update existing record</option>
              <option value="create_anyway">Create new record anyway</option>
              <option value="skip">Do nothing (skip)</option>
            </select>
            {(form.crm.duplicateAction ?? "update") === "update" && (
              <p className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 animate-fade-in">
                Submitted values will overwrite existing field values on the matching Lead/Customer record.
              </p>
            )}
          </div>
        )}

        {form.crm.action !== "none" && (
          <div className="mt-3 space-y-3">
            {(form.crm.action === "lead" || form.crm.action === "lead_deal") && (
              <>
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="grid grid-cols-2 gap-px bg-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="bg-muted/60 px-3 py-2">Form Field</div>
                    <div className="bg-muted/60 px-3 py-2">Lead Property</div>
                  </div>
                  <div className="divide-y divide-border">
                    {form.sections.flatMap((s) => s.fields.filter((f) => f.included && f.type !== "hidden")).map((f) => (
                      <div key={f.id} className="grid grid-cols-2 gap-px bg-border">
                        <div className="flex items-center bg-background px-3 py-2 text-xs font-medium truncate">{f.displayName}</div>
                        <div className="bg-background px-2 py-1.5">
                          <select
                            value={form.crm.fieldMap[f.id] ?? ""}
                            onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, fieldMap: { ...form.crm.fieldMap, [f.id]: e.target.value } } })}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                          >
                            <option value="">— Skip —</option>
                            <option value="lead_name">Lead Name</option>
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="company">Company</option>
                            <option value="lead_source">Lead Source</option>
                            <option value="industry">Industry</option>
                            <option value="website">Website</option>
                            <option value="notes">Notes</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Field label="Set Lead Status">
                  <select
                    value={form.crm.defaultLeadStatus || "New"}
                    onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, defaultLeadStatus: e.target.value } })}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    {["New", "Prospect", "Qualified", "Won", "Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </>
            )}
            {(form.crm.action === "deal" || form.crm.action === "lead_deal") && (
              <Field label="Set Deal Stage">
                <select
                  value={form.crm.defaultDealStage || "Discovery"}
                  onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, defaultDealStage: e.target.value } })}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
            )}
            {form.crm.action === "ticket" && (
              <>
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="grid grid-cols-2 gap-px bg-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="bg-muted/60 px-3 py-2">Form Field</div>
                    <div className="bg-muted/60 px-3 py-2">Ticket Property</div>
                  </div>
                  <div className="divide-y divide-border">
                    {form.sections.flatMap((s) => s.fields.filter((f) => f.included && f.type !== "hidden")).map((f) => (
                      <div key={f.id} className="grid grid-cols-2 gap-px bg-border">
                        <div className="flex items-center bg-background px-3 py-2 text-xs font-medium truncate">{f.displayName}</div>
                        <div className="bg-background px-2 py-1.5">
                          <select
                            value={form.crm.fieldMap[f.id] ?? ""}
                            onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, fieldMap: { ...form.crm.fieldMap, [f.id]: e.target.value } } })}
                            className="w-full rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                          >
                            <option value="">— Skip —</option>
                            <option value="subject">Subject</option>
                            <option value="description">Description</option>
                            <option value="priority">Priority</option>
                            <option value="type">Type</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
                  Ticket will be created in the Claims module and assigned to the Support team.
                </p>
              </>
            )}
            {form.crm.action !== "ticket" && (
              <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                Status will not be moved backward if the record is already at a later stage.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="mt-4 border-t border-border pt-4">
        <button
          onClick={() => setContactMatchOpen((o) => !o)}
          className="flex w-full items-center justify-between text-sm font-semibold"
        >
          Contact Matching
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${contactMatchOpen ? "rotate-180" : ""}`} />
        </button>
        {contactMatchOpen && (
          <div className="mt-3 space-y-3 animate-fade-in">
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Match submissions to existing records by:</div>
              {([
                { key: "matchByEmail", label: "Email address", defaultOn: true },
                { key: "matchByCompany", label: "Company name", defaultOn: false },
                { key: "matchByPhone", label: "Phone number", defaultOn: false },
              ] as const).map(({ key, label, defaultOn }) => (
                <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={form.crm[key] ?? defaultOn}
                    onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, [key]: e.target.checked } })}
                  />
                  {label}
                </label>
              ))}
            </div>
            <Field label="When a match is found:">
              <select
                value={form.crm.matchFoundAction ?? "link"}
                onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, matchFoundAction: e.target.value as never } })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="link">Link submission to existing record</option>
                <option value="link_update">Link and update record fields</option>
                <option value="ignore">Ignore match (always create new)</option>
              </select>
            </Field>
            <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              Kai will also run duplicate detection on new record creation.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 text-sm font-semibold">Quick Automation</div>
        <Row label="Send follow-up email" checked={form.automation.sendEmail} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, sendEmail: v } })} />
        {form.automation.sendEmail && (
          <div className="mb-1 pl-2 border-l-2 border-primary/30">
            <select
              value={form.automation.emailTemplate}
              onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, emailTemplate: e.target.value } })}
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              {["Thank You", "RFQ Received", "Trade Show Follow-Up", "Account Application Received", "General Acknowledgement"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        )}
        <Row label="Notify team" checked={form.automation.notifyTeam} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, notifyTeam: v } })} />
        {form.automation.notifyTeam && (
          <div className="mb-1 pl-2 border-l-2 border-primary/30 space-y-1.5">
            <div className="text-xs text-muted-foreground font-medium">Notify these users / roles:</div>
            {(["Admin", "Sales Manager", "Sales Rep", "John Carmichael", "Tyler Jones", "Auto-assigned rep"] as const).map((target) => {
              const selected = form.automation.notifyTargets.includes(target);
              return (
                <label key={target} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={selected}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...form.automation.notifyTargets, target]
                        : form.automation.notifyTargets.filter((t) => t !== target);
                      store.updateForm(form.id, { automation: { ...form.automation, notifyTargets: next } });
                    }}
                  />
                  {target}
                </label>
              );
            })}
          </div>
        )}
        <Row label="Notify assigned Sales Rep" checked={!!form.automation.notifyRep} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, notifyRep: v } })} />
        {form.automation.notifyRep && (
          <div className="mb-1 pl-2 border-l-2 border-primary/30">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Sales Rep assigned to the Lead/Customer (via auto-assign or existing record) will receive an email notification with the submitted form data.
            </p>
          </div>
        )}
        <Row label="Create task" checked={form.automation.createTask} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, createTask: v } })} />
        {form.automation.createTask && (
          <div className="mb-1 pl-2 border-l-2 border-primary/30 space-y-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Task title</span>
              <input
                value={form.automation.taskTitle}
                onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskTitle: e.target.value } })}
                placeholder="e.g. Follow up with {{Company Name}}"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <span className="mt-0.5 block text-[10px] text-muted-foreground">Use {"{{Field Name}}"} to insert form values.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Assign to</span>
              <select
                value={form.automation.taskAssignee}
                onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskAssignee: e.target.value } })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="">— Select —</option>
                <option value="Round-Robin">Round-Robin</option>
                <option value="Auto-assigned rep">Auto-assigned rep</option>
                <option value="John Carmichael">John Carmichael</option>
                <option value="Tyler Jones">Tyler Jones</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Due date</span>
              <select
                value={form.automation.taskDue}
                onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskDue: e.target.value } })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="+1 day">+1 day</option>
                <option value="+2 days">+2 days</option>
                <option value="+1 week">+1 week</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Priority</span>
              <select
                value={form.automation.taskPriority}
                onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskPriority: e.target.value } })}
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
          </div>
        )}
        <Row label="Kai Dedup (detect duplicates on submit)" checked={!!form.automation.kaiDedup} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, kaiDedup: v } })} />
        <Link to="/settings/workflow-manager/$workflowId" params={{ workflowId: "w_1" }} search={{ fromFormId: form.id }} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Advanced automation →</Link>
      </div>
    </div>
  );
}

function FieldEditPanel({ formId, sectionId, field, allFields }: { formId: string; sectionId: string; field: FormField; allFields: { id: string; name: string }[] }) {
  const store = useStore();
  const update = (patch: Partial<FormField>) => store.updateField(formId, sectionId, field.id, patch);
  const [condOpen, setCondOpen] = useState((field.conditions?.rules.length ?? 0) > 0);
  const conditions: VisibilityConditions = field.conditions ?? { logic: "AND", rules: [] };

  const OPERATORS: { value: ConditionOperator; label: string }[] = [
    { value: "equals", label: "equals" },
    { value: "not_equals", label: "not equals" },
    { value: "contains", label: "contains" },
    { value: "is_blank", label: "is blank" },
    { value: "greater_than", label: "greater than" },
    { value: "less_than", label: "less than" },
  ];

  const setConditions = (c: VisibilityConditions) => update({ conditions: c.rules.length === 0 ? undefined : c });
  const addCondition = () => {
    const first = allFields[0]?.id ?? "";
    setConditions({ logic: conditions.logic, rules: [...conditions.rules, { fieldId: first, operator: "equals", value: "" }] });
    setCondOpen(true);
  };
  const updateRule = (i: number, patch: Partial<{ fieldId: string; operator: ConditionOperator; value: string }>) => {
    const rules = conditions.rules.map((r, idx) => idx === i ? { ...r, ...patch } : r);
    setConditions({ ...conditions, rules });
  };
  const removeRule = (i: number) => setConditions({ ...conditions, rules: conditions.rules.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" /> Edit Field</div>
      <Field label="Field ID">
        <input readOnly value={field.id} className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground" />
      </Field>
      <Field label="Display Name">
        <input value={field.displayName} onChange={(e) => update({ displayName: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      </Field>
      <Field label="Type">
        <select value={field.type} onChange={(e) => update({ type: e.target.value as FieldType })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
          {(Object.keys(FIELD_TYPE_META) as FieldType[]).map((t) => <option key={t} value={t}>{FIELD_TYPE_META[t].label}</option>)}
        </select>
      </Field>
      {field.type !== "hidden" && (
        <Field label="Placeholder">
          <input value={field.placeholder ?? ""} onChange={(e) => update({ placeholder: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </Field>
      )}
      <Field label="Help text">
        <textarea value={field.helpText ?? ""} onChange={(e) => update({ helpText: e.target.value })} rows={2} className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      </Field>
      {field.type === "hidden" && (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <EyeOff className="h-3.5 w-3.5" /> Hidden Field Config
          </div>
          <Field label="Default value">
            <input
              value={field.defaultValue ?? ""}
              onChange={(e) => update({ defaultValue: e.target.value || undefined })}
              placeholder="e.g. tradeshow"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <div className="flex items-center justify-between py-1 text-sm">
            <div>
              <div className="font-medium">Capture from URL parameter</div>
              <div className="text-xs text-muted-foreground">Pre-fill from a query string on page load.</div>
            </div>
            <Toggle checked={!!field.captureFromUrl} onChange={(v) => update({ captureFromUrl: v, urlParamName: v ? (field.urlParamName ?? "") : undefined })} />
          </div>
          {field.captureFromUrl && (
            <Field label="URL parameter name">
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-sm text-muted-foreground">?</span>
                <input
                  value={field.urlParamName ?? ""}
                  onChange={(e) => update({ urlParamName: e.target.value })}
                  placeholder="e.g. utm_source"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </Field>
          )}
        </div>
      )}
      {field.type === "currency" && (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget Range</div>
          <p className="text-xs text-muted-foreground">Set optional min/max bounds shown as a dual-input range on the form.</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Min ($)</span>
              <input
                type="number"
                min={0}
                value={field.budgetMin ?? ""}
                onChange={(e) => update({ budgetMin: e.target.value || undefined })}
                placeholder="e.g. 1000"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Max ($)</span>
              <input
                type="number"
                min={0}
                value={field.budgetMax ?? ""}
                onChange={(e) => update({ budgetMax: e.target.value || undefined })}
                placeholder="e.g. 50000"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
      {field.type === "consent" && (
        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Consent Configuration</div>
          <Field label="Consent text">
            <textarea
              value={field.consentText ?? ""}
              onChange={(e) => update({ consentText: e.target.value })}
              rows={3}
              placeholder="e.g. I agree to receive communications…"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          <Field label="Privacy Policy URL">
            <input
              type="url"
              value={field.privacyUrl ?? ""}
              onChange={(e) => update({ privacyUrl: e.target.value })}
              placeholder="https://example.com/privacy"
              className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </Field>
          {(field.consentText || field.privacyUrl) && (
            <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Preview: </span>
              <label className="inline-flex items-start gap-1.5">
                <input type="checkbox" className="mt-0.5 h-3 w-3 shrink-0" disabled />
                <span>
                  {field.consentText || "Consent text"}{" "}
                  {field.privacyUrl && (
                    <a href={field.privacyUrl} target="_blank" rel="noreferrer" className="text-primary underline" onClick={(e) => e.preventDefault()}>
                      Privacy policy
                    </a>
                  )}
                </span>
              </label>
            </div>
          )}
        </div>
      )}
      {(field.type === "select" || field.type === "multi_select" || field.type === "radio") && (
        <>
          <Field label="Options">
            <div className="space-y-2">
              {(field.options ?? []).map((opt, i) => {
                const opts = field.options ?? [];
                return (

                  <div
                    key={i}
                    className="flex items-center gap-2"
                    draggable
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(i)); }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const from = Number(e.dataTransfer.getData("text/plain")); if (!Number.isNaN(from) && from !== i) { const next = [...opts]; const [m] = next.splice(from, 1); next.splice(i, 0, m); update({ options: next }); } }}
                  >
                    <span className="cursor-grab text-muted-foreground active:cursor-grabbing" aria-label="Drag to reorder"><GripVertical className="h-4 w-4" /></span>
                    <input value={opt.label} onChange={(e) => { const o = [...opts]; o[i] = { ...o[i], label: e.target.value }; update({ options: o }); }} className="flex-1 rounded-md border border-border px-2 py-1 text-sm" placeholder="Label" />
                    <input value={opt.value} onChange={(e) => { const o = [...opts]; o[i] = { ...o[i], value: e.target.value }; update({ options: o }); }} className="w-24 rounded-md border border-border px-2 py-1 text-sm" placeholder="Value" />
                    <button onClick={() => { const o = opts.filter((_, idx) => idx !== i); const def = field.defaultValue; const stillThere = o.some((x) => x.value === def); update({ options: o, ...(stillThere ? {} : { defaultValue: undefined }) }); }} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove option"><X className="h-3.5 w-3.5" /></button>
                  </div>
                );
              })}
              <button onClick={() => update({ options: [...(field.options ?? []), { label: "New option", value: "opt" + ((field.options?.length ?? 0) + 1) }] })} className="text-xs text-primary hover:underline">+ Add option</button>
            </div>
          </Field>
          <Row
            label="Set a default value"
            checked={field.defaultValue !== undefined && field.defaultValue !== ""}
            onChange={(v) => update({ defaultValue: v ? (field.options?.[0]?.value ?? "") : undefined })}
          />
          {field.defaultValue !== undefined && field.defaultValue !== "" && (
            field.type === "multi_select" ? (
              <Field label="Default values">
                <div className="space-y-1 rounded-md border border-border p-2">
                  {(field.options ?? []).map((opt) => {
                    const selected = (field.defaultValue ?? "").split(",").map((s) => s.trim()).filter(Boolean);
                    const isOn = selected.includes(opt.value);
                    return (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={isOn} onChange={(e) => {
                          const next = e.target.checked ? [...selected, opt.value] : selected.filter((s) => s !== opt.value);
                          update({ defaultValue: next.join(",") });
                        }} />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </Field>
            ) : (
              <Field label="Default value">
                <select value={field.defaultValue ?? ""} onChange={(e) => update({ defaultValue: e.target.value })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
                  {(field.options ?? []).map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </Field>
            )
          )}
        </>
      )}

      <Row label="Required" checked={field.required} onChange={(v) => update({ required: v })} />
      <Row label="Include in form" checked={field.included} onChange={(v) => update({ included: v })} />

      {/* Visibility Conditions */}
      <div className="rounded-lg border border-border bg-background">
        <button
          type="button"
          onClick={() => setCondOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            {condOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            Visibility Conditions
            {conditions.rules.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-700 dark:bg-purple-500/15 dark:text-purple-300">
                {conditions.rules.length}
              </span>
            )}
          </span>
        </button>
        {condOpen && (
          <div className="space-y-2 border-t border-border p-3">
            {conditions.rules.length === 0 && (
              <p className="text-xs text-muted-foreground">Field is always shown. Add a condition to control when it appears.</p>
            )}
            {conditions.rules.map((rule, i) => (
              <div key={i} className="space-y-2">
                {i > 0 && (
                  <div className="flex items-center gap-1 rounded-md border border-border bg-muted p-0.5 text-[11px] font-semibold w-fit">
                    {(["AND", "OR"] as const).map((op) => (
                      <button
                        key={op}
                        onClick={() => setConditions({ ...conditions, logic: op })}
                        className={`rounded px-2 py-0.5 ${conditions.logic === op ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                      >{op}</button>
                    ))}
                  </div>
                )}
                <div className="flex items-start gap-1 rounded-md border border-border bg-card p-2">
                  <div className="grid flex-1 grid-cols-1 gap-1.5">
                    <select
                      value={rule.fieldId}
                      onChange={(e) => updateRule(i, { fieldId: e.target.value })}
                      className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                    >
                      {allFields.length === 0 && <option value="">— No other fields —</option>}
                      {allFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <select
                      value={rule.operator}
                      onChange={(e) => updateRule(i, { operator: e.target.value as ConditionOperator })}
                      className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                    >
                      {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {rule.operator !== "is_blank" && (
                      <input
                        value={rule.value}
                        onChange={(e) => updateRule(i, { value: e.target.value })}
                        placeholder="Value"
                        className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
                      />
                    )}
                  </div>
                  <button onClick={() => removeRule(i)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive" aria-label="Remove condition">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            <button
              onClick={addCondition}
              className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-2 py-1 text-xs font-medium text-primary hover:bg-primary/5"
            >
              <Plus className="h-3 w-3" /> Add Condition
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-1.5">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function StylePanel({ form }: { form: Form }) {
  const store = useStore();
  const style: FormStyle = form.style ?? DEFAULT_FORM_STYLE;
  const set = (patch: Partial<FormStyle>) => store.updateForm(form.id, { style: { ...style, ...patch } });
  const fonts: FormStyle["fontFamily"][] = ["Inter", "Roboto", "Open Sans", "System"];

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Palette className="h-4 w-4 text-primary" /> Styling
      </div>
      <p className="text-xs text-muted-foreground">Changes update the canvas in real time.</p>

      <Field label="Primary Color">
        <div className="flex items-center gap-2">
          <input type="color" value={style.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border bg-background p-0.5" />
          <input value={style.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-mono uppercase" />
        </div>
      </Field>

      <Field label="Button Color">
        <div className="flex items-center gap-2">
          <input type="color" value={style.buttonColor} onChange={(e) => set({ buttonColor: e.target.value })} className="h-9 w-12 cursor-pointer rounded border border-border bg-background p-0.5" />
          <input value={style.buttonColor} onChange={(e) => set({ buttonColor: e.target.value })} className="flex-1 rounded-md border border-border px-3 py-2 text-sm font-mono uppercase" />
        </div>
      </Field>

      <Field label="Font Family">
        <select value={style.fontFamily} onChange={(e) => set({ fontFamily: e.target.value as FormStyle["fontFamily"] })} className="w-full rounded-md border border-border px-3 py-2 text-sm">
          {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>

      <Field label={`Field Border Radius — ${style.fieldRadius}px`}>
        <input type="range" min={0} max={16} step={1} value={style.fieldRadius} onChange={(e) => set({ fieldRadius: Number(e.target.value) })} className="w-full accent-primary" />
      </Field>

      <Field label={`Button Border Radius — ${style.buttonRadius}px`}>
        <input type="range" min={0} max={16} step={1} value={style.buttonRadius} onChange={(e) => set({ buttonRadius: Number(e.target.value) })} className="w-full accent-primary" />
      </Field>

      <Field label="Submit Button Text">
        <input value={style.submitText} onChange={(e) => set({ submitText: e.target.value })} placeholder="Submit" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
      </Field>

      <div className="rounded-lg border border-border bg-background p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</div>
        <button
          type="button"
          className="w-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: style.buttonColor, borderRadius: style.buttonRadius }}
        >
          {style.submitText || "Submit"}
        </button>
      </div>

      <button
        onClick={() => store.updateForm(form.id, { style: { ...DEFAULT_FORM_STYLE } })}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function GovernancePanel({ form }: { form: Form }) {
  const store = useStore();
  const gov: FormGovernance = form.governance ?? DEFAULT_GOVERNANCE;
  const set = (patch: Partial<FormGovernance>) => store.updateForm(form.id, { governance: { ...gov, ...patch } });
  const setRole = (role: RoleName, patch: Partial<RolePermissions>) =>
    set({ permissions: { ...gov.permissions, [role]: { ...gov.permissions[role], ...patch } } });

  const ROLES: RoleName[] = ["Admin", "Sales Manager", "Sales Rep"];
  const PERMS: { key: keyof RolePermissions; label: string }[] = [
    { key: "create", label: "Create" },
    { key: "view",   label: "View"   },
    { key: "edit",   label: "Edit"   },
    { key: "delete", label: "Delete" },
  ];

  return (
    <div className="space-y-5">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <Shield className="h-4 w-4 text-primary" /> Governance & Settings
      </div>

      {/* Permissions */}
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Permissions
        </div>
        <div className="p-3">
          <div className="grid grid-cols-[1fr_repeat(4,minmax(0,44px))] items-center gap-y-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Role</span>
            {PERMS.map((p) => <span key={p.key} className="text-center">{p.label}</span>)}
          </div>
          <div className="mt-1 divide-y divide-border">
            {ROLES.map((role) => (
              <div key={role} className="grid grid-cols-[1fr_repeat(4,minmax(0,44px))] items-center gap-y-2 py-2">
                <span className="text-sm font-medium">{role}</span>
                {PERMS.map((p) => (
                  <label key={p.key} className="flex justify-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer accent-primary"
                      checked={gov.permissions[role][p.key]}
                      onChange={(e) => setRole(role, { [p.key]: e.target.checked } as Partial<RolePermissions>)}
                    />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAPTCHA */}
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          CAPTCHA
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">Enable CAPTCHA</div>
              <div className="text-xs text-muted-foreground">Protect this form from spam &amp; bots.</div>
            </div>
            <Toggle checked={gov.captchaEnabled} onChange={(v) => set({ captchaEnabled: v })} />
          </div>
          {gov.captchaEnabled && (
            <div className="space-y-2 rounded-md border border-dashed border-border p-3">
              <div className="text-xs font-medium text-muted-foreground">CAPTCHA version</div>
              {(["v3", "v2"] as const).map((v) => (
                <label key={v} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="radio"
                    name="captcha-version"
                    className="mt-0.5 accent-primary"
                    checked={gov.captchaVersion === v}
                    onChange={() => set({ captchaVersion: v })}
                  />
                  <span>
                    <span className="font-medium">reCAPTCHA {v}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {v === "v3" ? "— invisible, score-based" : "— visible checkbox challenge"}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Consent & Privacy */}
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Consent &amp; Privacy
        </div>
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between text-sm">
            <div>
              <div className="font-medium">Add GDPR consent footer</div>
              <div className="text-xs text-muted-foreground">Shown below the Submit button.</div>
            </div>
            <Toggle checked={gov.gdprConsent} onChange={(v) => set({ gdprConsent: v })} />
          </div>
          {gov.gdprConsent && (
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted-foreground">Consent text</span>
              <textarea
                value={gov.gdprText}
                onChange={(e) => set({ gdprText: e.target.value })}
                rows={4}
                className="w-full rounded-md border border-border px-3 py-2 text-sm"
              />
            </label>
          )}
        </div>
      </section>
    </div>
  );
}
