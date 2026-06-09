import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Settings, Palette, Shield, Star, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Toggle } from "@/components/ui-kit";
import { useStore, getSectionFields, DEFAULT_FORM_STYLE, DEFAULT_GOVERNANCE, type Form, type FormStyle, type FormGovernance, type RoleName, type RolePermissions } from "@/lib/forms-store";
import {
  CRM_ACTIONS, CRM_PROPERTIES, getActionLabel, getEntityLabel, getPropertiesForEntity,
  getDefaultMatchKeys, getDefaultMatchFoundAction, getMatchingSummary, suggestFieldMapping,
  entityForAction, entityBadgeClasses,
  type CrmAction, type CrmPropertySeed,
} from "@/lib/crm-catalog";

type Tab = "submission" | "automation" | "style" | "settings";

export function FormSettingsTabs({ form }: { form: Form }) {
  const [tab, setTab] = useState<Tab>("submission");
  return (
    <div>
      <div className="mb-3 flex items-center gap-1 rounded-md border border-border bg-muted/40 p-0.5">
        <TabBtn active={tab === "submission"} onClick={() => setTab("submission")}>Submission</TabBtn>
        <TabBtn active={tab === "automation"} onClick={() => setTab("automation")}>Automation</TabBtn>
        <TabBtn active={tab === "style"} onClick={() => setTab("style")}>Style</TabBtn>
        <TabBtn active={tab === "settings"} onClick={() => setTab("settings")}>Settings</TabBtn>
      </div>
      {tab === "submission" && <SubmissionTab form={form} />}
      {tab === "automation" && <AutomationTab form={form} />}
      {tab === "style" && <StyleTab form={form} />}
      {tab === "settings" && <SettingsTab form={form} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex-1 rounded px-2 py-1.5 text-[11px] font-semibold ${active ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
      {children}
    </button>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block py-1.5">
      <span className="mb-1 block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SubmissionTab({ form }: { form: Form }) {
  const store = useStore();

  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> After Submission</div>
      <Labeled label="Behavior">
        <div className="space-y-1">
          {[
            { v: "message", label: "Show thank-you message" },
            { v: "redirect", label: "Redirect to URL" },
            { v: "both", label: "Message then redirect" },
          ].map((o) => (
            <label key={o.v} className="flex items-center gap-2 text-sm">
              <input type="radio" name="aftermode" checked={form.afterSubmit.mode === o.v} onChange={() => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, mode: o.v as never } })} />
              {o.label}
            </label>
          ))}
        </div>
      </Labeled>
      {(form.afterSubmit.mode === "message" || form.afterSubmit.mode === "both") && (
        <Labeled label="Thank-you message">
          <textarea value={form.afterSubmit.message} onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, message: e.target.value } })} rows={3} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
        </Labeled>
      )}
      {form.afterSubmit.mode === "both" && (
        <Labeled label={`Redirect delay — ${form.afterSubmit.delay ?? 3}s`}>
          <input type="range" min={2} max={10} step={1} value={form.afterSubmit.delay ?? 3} onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, delay: Number(e.target.value) } })} className="w-full accent-primary" />
        </Labeled>
      )}
      {(form.afterSubmit.mode === "redirect" || form.afterSubmit.mode === "both") && (
        <Labeled label="Redirect URL">
          <input value={form.afterSubmit.redirectUrl} onChange={(e) => store.updateForm(form.id, { afterSubmit: { ...form.afterSubmit, redirectUrl: e.target.value } })} placeholder="https://…" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
        </Labeled>
      )}

      {/* CRM action — single catalog-driven panel for all 13 entity types */}
      <div className="mt-4 border-t border-border pt-4">
        <EntityActionPanel form={form} />
      </div>
    </div>
  );
}

// One component for all CRM actions. The catalog drives everything that
// appears below the action selector — no per-entity hardcoded panels.
function EntityActionPanel({ form }: { form: Form }) {
  const store = useStore();
  const action = form.crm.action;
  const entity = entityForAction(action);

  // Stable setter that always reads the latest crm off a ref, so child effects
  // (auto-mapping) that capture it can't clobber concurrent edits with stale state.
  const formRef = useRef(form);
  formRef.current = form;
  const setCrm = useCallback(
    (patch: Partial<Form["crm"]>) =>
      store.updateForm(formRef.current.id, { crm: { ...formRef.current.crm, ...patch } }),
    [store],
  );

  // Changing the action resets match keys + matchFoundAction to the new entity's
  // defaults and clears the field map (old mappings don't apply to a new entity).
  const onActionChange = (next: CrmAction) => {
    setCrm({
      action: next,
      matchKeys: getDefaultMatchKeys(next),
      matchFoundAction: getDefaultMatchFoundAction(next),
      fieldMap: {},
      defaults: {},
    });
  };

  return (
    <div>
      <div className="mb-2 text-sm font-semibold">CRM Action</div>
      <select
        value={action}
        onChange={(e) => onActionChange(e.target.value as CrmAction)}
        className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
      >
        <option value="none">{getActionLabel("none")}</option>
        {CRM_ACTIONS.map((a) => (
          <option key={a} value={a}>{getActionLabel(a)}</option>
        ))}
      </select>

      {action === "none" || !entity ? (
        <p className="mt-3 rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          No CRM record will be created when this form is submitted.
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <DefaultsSection form={form} entity={entity} setCrm={setCrm} />
          {/* key={entity} resets auto-map session state when the action changes */}
          <FieldMappingSection key={entity} form={form} entity={entity} setCrm={setCrm} />
          <MatchingChip action={action} matchFoundAction={form.crm.matchFoundAction} />
          <AdvancedSettings form={form} action={action} setCrm={setCrm} />
        </div>
      )}
    </div>
  );
}

type SetCrm = (patch: Partial<Form["crm"]>) => void;

function findProp(id: string): CrmPropertySeed | undefined {
  return CRM_PROPERTIES.find((p) => p.id === id);
}

// Auto-generated from the entity's select and checkbox properties. Collapses to
// a summary chip when the form already carries starter defaults.
function DefaultsSection({ form, entity, setCrm }: { form: Form; entity: NonNullable<ReturnType<typeof entityForAction>>; setCrm: SetCrm }) {
  const props = getPropertiesForEntity(entity).filter(
    (p) => (p.defaultFieldType === "select" && p.options?.length) || p.defaultFieldType === "checkbox",
  );
  const defaultsEntries = Object.entries(form.crm.defaults);
  // Pre-configured (has defaults) → collapsed; none → expanded. User edits keep it open.
  const [open, setOpen] = useState(defaultsEntries.length === 0);
  if (props.length === 0) return null;

  const setDefault = (id: string, value: string | boolean) => {
    setOpen(true);
    setCrm({ defaults: { ...form.crm.defaults, [id]: value } });
  };

  const summary = defaultsEntries.map(([k, v]) => `${k}=${v}`).join(", ");

  return (
    <section className="rounded-lg border border-border bg-background p-2.5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Defaults</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {!open && defaultsEntries.length > 0 && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Defaults configured ({summary}). Click to edit.
        </p>
      )}

      {open && (
        <div className="mt-2 space-y-1.5">
          {props.map((p) => {
            const current = form.crm.defaults[p.id];
            if (p.defaultFieldType === "checkbox") {
              return (
                <label key={p.id} className="flex items-center justify-between gap-2 py-1 text-sm">
                  <span>Default {p.label}</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={current === true}
                    onChange={(e) => setDefault(p.id, e.target.checked)}
                  />
                </label>
              );
            }
            return (
              <Labeled key={p.id} label={`Default ${p.label}`}>
                <select
                  value={typeof current === "string" ? current : ""}
                  onChange={(e) => setDefault(p.id, e.target.value)}
                  className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
                >
                  <option value="">— None —</option>
                  {p.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Labeled>
            );
          })}
        </div>
      )}
    </section>
  );
}

// Maps form fields on the canvas onto the entity's catalog properties. Shows a
// focused default view (mapped + commonly-used) and auto-suggests mappings for
// newly-added fields.
function FieldMappingSection({ form, entity, setCrm }: { form: Form; entity: NonNullable<ReturnType<typeof entityForAction>>; setCrm: SetCrm }) {
  const includedFields = form.sections.flatMap((s) => getSectionFields(s).filter((f) => f.included && f.type !== "hidden"));
  const props = getPropertiesForEntity(entity);

  const [showAll, setShowAll] = useState(false);
  const [autoMapped, setAutoMapped] = useState<Set<string>>(new Set());
  const processedRef = useRef<Set<string>>(new Set());
  // Always-latest fieldMap so the auto-map effect merges onto current state.
  const fieldMapRef = useRef(form.crm.fieldMap);
  fieldMapRef.current = form.crm.fieldMap;

  // Auto-map newly-added fields. Keyed on a signature of field ids+labels so the
  // effect only runs when fields actually change, not on every render.
  const fieldSig = includedFields.map((f) => `${f.id}:${f.displayName}`).join("|");
  useEffect(() => {
    const base = { ...fieldMapRef.current };
    const mappedFieldIds = new Set(Object.values(base));
    const added: string[] = [];
    for (const f of includedFields) {
      if (processedRef.current.has(f.id)) continue;
      processedRef.current.add(f.id);
      if (mappedFieldIds.has(f.id)) continue; // already mapped (seed or manual)
      const sug = suggestFieldMapping(f.displayName, entity);
      if (!sug || base[sug.propertyId]) continue; // no match, or property already taken
      base[sug.propertyId] = f.id;
      mappedFieldIds.add(f.id);
      added.push(sug.propertyId);
    }
    if (added.length) {
      setCrm({ fieldMap: base });
      setAutoMapped((prev) => { const n = new Set(prev); added.forEach((id) => n.add(id)); return n; });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldSig, entity]);

  const setMapping = (propertyId: string, fieldId: string) => {
    const next = { ...form.crm.fieldMap };
    if (fieldId) next[propertyId] = fieldId;
    else delete next[propertyId];
    setCrm({ fieldMap: next });
    // A manual change takes ownership — drop the auto-mapped badge.
    setAutoMapped((prev) => { const n = new Set(prev); n.delete(propertyId); return n; });
  };

  const visible = showAll ? props : props.filter((p) => p.commonlyUsed || form.crm.fieldMap[p.id]);
  const hiddenCount = props.length - visible.length;

  return (
    <section className="rounded-lg border border-border bg-background overflow-hidden">
      <div className="grid grid-cols-2 gap-px bg-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <div className="bg-muted/60 px-2 py-1.5">Entity Property</div>
        <div className="bg-muted/60 px-2 py-1.5">Populate from</div>
      </div>
      <div className="max-h-72 divide-y divide-border overflow-y-auto">
        {visible.map((p) => (
          <div key={p.id} className="grid grid-cols-2 gap-px bg-border">
            <div className="flex flex-col justify-center bg-background px-2 py-1.5">
              <span className="flex items-center gap-1 text-[11px] font-medium truncate">
                {p.commonlyUsed && <Star className="h-2.5 w-2.5 shrink-0 fill-green-500 text-green-500" />}
                <span className={p.commonlyUsed ? "font-semibold" : ""}>{p.label}</span>
                {p.helpText && <span title={p.helpText} className="shrink-0 cursor-help text-muted-foreground/70"><Info className="h-2.5 w-2.5" /></span>}
              </span>
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                {p.group}
                {p.lookupEntity && (
                  <span className={`rounded-full px-1 py-px text-[8px] font-medium ${entityBadgeClasses(p.lookupEntity)}`}>
                    Lookup → {getEntityLabel(p.lookupEntity)}
                  </span>
                )}
              </span>
            </div>
            <div className="bg-background px-1.5 py-1">
              <select
                value={form.crm.fieldMap[p.id] ?? ""}
                onChange={(e) => setMapping(p.id, e.target.value)}
                className="w-full rounded border border-border bg-background px-1.5 py-1 text-[11px]"
              >
                <option value="">— Not mapped —</option>
                {includedFields.map((f) => (
                  <option key={f.id} value={f.id}>{f.displayName}</option>
                ))}
              </select>
              {autoMapped.has(p.id) && form.crm.fieldMap[p.id] && (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-medium text-purple-600">
                  <Sparkles className="h-2.5 w-2.5" /> Auto-mapped
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {(hiddenCount > 0 || showAll) && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="flex w-full items-center justify-center gap-0.5 border-t border-border bg-muted/30 px-2 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {showAll
            ? <>Show less <ChevronUp className="h-3 w-3" /></>
            : <>Show all properties ({hiddenCount} more) <ChevronDown className="h-3 w-3" /></>}
        </button>
      )}
    </section>
  );
}

// Plain-English info chip summarizing duplicate-matching behavior.
function MatchingChip({ action, matchFoundAction }: { action: CrmAction; matchFoundAction?: Form["crm"]["matchFoundAction"] }) {
  return (
    <div className="flex items-start gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-[11px] text-muted-foreground">
      <Info className="mt-0.5 h-3 w-3 shrink-0" />
      <span><span className="font-medium text-foreground">Duplicate matching:</span> {getMatchingSummary(action, matchFoundAction ?? undefined)} Edit in Advanced settings.</span>
    </div>
  );
}

// Collapsed-by-default disclosure holding the Record Matching controls.
function AdvancedSettings({ form, action, setCrm }: { form: Form; action: CrmAction; setCrm: SetCrm }) {
  const [open, setOpen] = useState(false);
  const defaultKeys = getDefaultMatchKeys(action);
  const selected = new Set(form.crm.matchKeys);
  const toggle = (key: string, on: boolean) => {
    const next = on ? [...selected, key] : [...selected].filter((k) => k !== key);
    setCrm({ matchKeys: next });
  };

  return (
    <section className="rounded-lg border border-border bg-background">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="flex items-center gap-1.5"><Settings className="h-3.5 w-3.5" /> Advanced settings</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="space-y-2.5 border-t border-border p-2.5">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Matching defaults applied:</span>{" "}
            {getMatchingSummary(action, form.crm.matchFoundAction ?? undefined)}
          </p>

          {defaultKeys.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Record Matching</div>
              <p className="mt-1 text-[11px] text-muted-foreground">Match incoming submissions to existing records by:</p>
              <div className="mt-2 space-y-1.5">
                {defaultKeys.map((key) => {
                  const prop = findProp(key);
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4 accent-primary"
                        checked={selected.has(key)}
                        onChange={(e) => toggle(key, e.target.checked)}
                      />
                      {prop?.label ?? key}
                    </label>
                  );
                })}
              </div>
              <Labeled label="When a match is found:">
                <select
                  value={form.crm.matchFoundAction ?? "link"}
                  onChange={(e) => setCrm({ matchFoundAction: e.target.value as Form["crm"]["matchFoundAction"] })}
                  className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
                >
                  <option value="link">Link to existing record</option>
                  <option value="link_update">Link and update fields</option>
                  <option value="ignore">Ignore match (always create new)</option>
                </select>
              </Labeled>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function AutomationTab({ form }: { form: Form }) {
  const store = useStore();
  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Quick Automation</div>
      <ToggleRow label="Send follow-up email" checked={form.automation.sendEmail} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, sendEmail: v } })} />
      {form.automation.sendEmail && (
        <div className="mb-1 pl-2 border-l-2 border-primary/30">
          <select
            value={form.automation.emailTemplate}
            onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, emailTemplate: e.target.value } })}
            className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
          >
            {["Thank You", "RFQ Received", "Trade Show Follow-Up", "Account Application Received", "General Acknowledgement"].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      )}
      <ToggleRow label="Notify team" checked={form.automation.notifyTeam} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, notifyTeam: v } })} />
      {form.automation.notifyTeam && (
        <div className="mb-1 pl-2 border-l-2 border-primary/30 space-y-1.5">
          <div className="text-[11px] text-muted-foreground font-medium">Notify these users / roles:</div>
          {(["Admin", "Sales Manager", "Sales Rep", "John Carmichael", "Tyler Jones", "Auto-assigned rep"] as const).map((target) => {
            const selected = form.automation.notifyTargets.includes(target);
            return (
              <label key={target} className="flex items-center gap-2 text-sm">
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
      <ToggleRow label="Notify assigned Sales Rep" checked={!!form.automation.notifyRep} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, notifyRep: v } })} />
      {form.automation.notifyRep && (
        <div className="mb-1 pl-2 border-l-2 border-primary/30">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            The Sales Rep assigned to the Retailer Account (via auto-assign or existing record) will receive an email notification with the submitted form data.
          </p>
        </div>
      )}
      <ToggleRow label="Create task" checked={form.automation.createTask} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, createTask: v } })} />
      {form.automation.createTask && (
        <div className="mb-1 pl-2 border-l-2 border-primary/30 space-y-2">
          <Labeled label="Task title">
            <input value={form.automation.taskTitle} onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskTitle: e.target.value } })} placeholder="e.g. Follow up with {{Company Name}}" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
          </Labeled>
          <Labeled label="Assign to">
            <select value={form.automation.taskAssignee} onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskAssignee: e.target.value } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
              <option value="">— Select —</option>
              <option value="Round-Robin">Round-Robin</option>
              <option value="Auto-assigned rep">Auto-assigned rep</option>
              <option value="John Carmichael">John Carmichael</option>
              <option value="Tyler Jones">Tyler Jones</option>
            </select>
          </Labeled>
          <Labeled label="Due date">
            <select value={form.automation.taskDue} onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskDue: e.target.value } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
              <option value="+1 day">+1 day</option>
              <option value="+2 days">+2 days</option>
              <option value="+1 week">+1 week</option>
            </select>
          </Labeled>
          <Labeled label="Priority">
            <select value={form.automation.taskPriority} onChange={(e) => store.updateForm(form.id, { automation: { ...form.automation, taskPriority: e.target.value } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </Labeled>
        </div>
      )}
      <ToggleRow label="Kai Dedup (detect duplicates on submit)" checked={!!form.automation.kaiDedup} onChange={(v) => store.updateForm(form.id, { automation: { ...form.automation, kaiDedup: v } })} />
      <Link to="/settings/workflow-manager/$workflowId" params={{ workflowId: "w_1" }} search={{ fromFormId: form.id }} className="mt-2 inline-block text-sm font-medium text-primary hover:underline">Advanced automation →</Link>
    </div>
  );
}

function StyleTab({ form }: { form: Form }) {
  const store = useStore();
  const style: FormStyle = form.style ?? DEFAULT_FORM_STYLE;
  const set = (patch: Partial<FormStyle>) => store.updateForm(form.id, { style: { ...style, ...patch } });
  const fonts: FormStyle["fontFamily"][] = ["Inter", "Roboto", "Open Sans", "System"];
  return (
    <div className="space-y-3">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4 text-primary" /> Styling</div>
      <Labeled label="Primary Color">
        <div className="flex items-center gap-2">
          <input type="color" value={style.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="h-8 w-10 rounded border border-border p-0.5" />
          <input value={style.primaryColor} onChange={(e) => set({ primaryColor: e.target.value })} className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-mono uppercase" />
        </div>
      </Labeled>
      <Labeled label="Button Color">
        <div className="flex items-center gap-2">
          <input type="color" value={style.buttonColor} onChange={(e) => set({ buttonColor: e.target.value })} className="h-8 w-10 rounded border border-border p-0.5" />
          <input value={style.buttonColor} onChange={(e) => set({ buttonColor: e.target.value })} className="flex-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-mono uppercase" />
        </div>
      </Labeled>
      <Labeled label="Font Family">
        <select value={style.fontFamily} onChange={(e) => set({ fontFamily: e.target.value as FormStyle["fontFamily"] })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
          {fonts.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </Labeled>
      <Labeled label={`Field Border Radius — ${style.fieldRadius}px`}>
        <input type="range" min={0} max={16} step={1} value={style.fieldRadius} onChange={(e) => set({ fieldRadius: Number(e.target.value) })} className="w-full accent-primary" />
      </Labeled>
      <Labeled label={`Button Border Radius — ${style.buttonRadius}px`}>
        <input type="range" min={0} max={16} step={1} value={style.buttonRadius} onChange={(e) => set({ buttonRadius: Number(e.target.value) })} className="w-full accent-primary" />
      </Labeled>
      <Labeled label="Submit Button Text">
        <input value={style.submitText} onChange={(e) => set({ submitText: e.target.value })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
      </Labeled>
      <button onClick={() => set({ ...DEFAULT_FORM_STYLE })} className="text-[11px] text-muted-foreground hover:text-foreground hover:underline">
        Reset to defaults
      </button>
    </div>
  );
}

function SettingsTab({ form }: { form: Form }) {
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
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold"><Settings className="h-4 w-4 text-primary" /> Form Settings</div>
      <Labeled label="Form Name">
        <input value={form.name} onChange={(e) => store.updateForm(form.id, { name: e.target.value })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
      </Labeled>
      <Labeled label="Description">
        <textarea value={form.description} onChange={(e) => store.updateForm(form.id, { description: e.target.value })} rows={3} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
      </Labeled>
      <Labeled label="Status">
        <select value={form.status} onChange={(e) => store.updateForm(form.id, { status: e.target.value as never })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </Labeled>
      <Labeled label="Type">
        <select value={form.kind} onChange={(e) => store.updateForm(form.id, { kind: e.target.value as never })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
          {["Lead Capture", "Contact", "RFQ", "Custom"].map((k) => <option key={k}>{k}</option>)}
        </select>
      </Labeled>
      <ToggleRow label="Multi-step wizard" checked={form.multiStep} onChange={(v) => store.updateForm(form.id, { multiStep: v })} />

      {/* Governance */}
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold border-t border-border pt-3"><Shield className="h-4 w-4 text-primary" /> Governance</div>
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Permissions</div>
        <div className="p-2">
          <div className="grid grid-cols-[1fr_repeat(4,minmax(0,40px))] items-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            <span>Role</span>
            {PERMS.map((p) => <span key={p.key} className="text-center">{p.label}</span>)}
          </div>
          <div className="mt-1 divide-y divide-border">
            {ROLES.map((role) => (
              <div key={role} className="grid grid-cols-[1fr_repeat(4,minmax(0,40px))] items-center py-1.5">
                <span className="text-xs font-medium">{role}</span>
                {PERMS.map((p) => (
                  <label key={p.key} className="flex justify-center">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={gov.permissions[role][p.key]} onChange={(e) => setRole(role, { [p.key]: e.target.checked } as Partial<RolePermissions>)} />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">CAPTCHA</div>
        <div className="space-y-2 p-2.5">
          <ToggleRow label="Enable CAPTCHA" checked={gov.captchaEnabled} onChange={(v) => set({ captchaEnabled: v })} />
          {gov.captchaEnabled && (
            <div className="space-y-1.5 rounded-md border border-dashed border-border p-2">
              {(["v3", "v2"] as const).map((v) => (
                <label key={v} className="flex items-start gap-2 text-xs">
                  <input type="radio" name="captcha" className="mt-0.5 accent-primary" checked={gov.captchaVersion === v} onChange={() => set({ captchaVersion: v })} />
                  <span><span className="font-medium">reCAPTCHA {v}</span> — {v === "v3" ? "invisible, score-based" : "visible checkbox"}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="rounded-lg border border-border bg-background">
        <div className="border-b border-border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Consent &amp; Privacy</div>
        <div className="space-y-2 p-2.5">
          <ToggleRow label="Add GDPR consent footer" checked={gov.gdprConsent} onChange={(v) => set({ gdprConsent: v })} />
          {gov.gdprConsent && (
            <Labeled label="Consent text">
              <textarea value={gov.gdprText} onChange={(e) => set({ gdprText: e.target.value })} rows={4} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
            </Labeled>
          )}
        </div>
      </section>
      <div className="space-y-1 border-t border-border pt-3 text-sm">
        <Link to="/forms/$formId/submissions" params={{ formId: form.id }} className="block text-primary hover:underline">View submissions →</Link>
        <Link to="/forms/$formId/share" params={{ formId: form.id }} className="block text-primary hover:underline">Share &amp; embed →</Link>
        <Link to="/forms/$formId/analytics" params={{ formId: form.id }} className="block text-primary hover:underline">Analytics →</Link>
      </div>
    </div>
  );
}
