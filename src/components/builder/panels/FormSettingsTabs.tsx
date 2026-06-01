import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Settings, Palette, Shield, ChevronDown } from "lucide-react";
import { Toggle } from "@/components/ui-kit";
import { useStore, getSectionFields, DEFAULT_FORM_STYLE, DEFAULT_GOVERNANCE, type Form, type FormStyle, type FormGovernance, type RoleName, type RolePermissions } from "@/lib/forms-store";

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
  const [contactMatchOpen, setContactMatchOpen] = useState(false);
  const includedFields = form.sections.flatMap((s) => getSectionFields(s).filter((f) => f.included && f.type !== "hidden"));

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

      {/* CRM action */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-2 text-sm font-semibold">CRM Action</div>
        <select value={form.crm.action} onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, action: e.target.value as never } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
          <option value="none">Do nothing</option>
          <option value="lead">Create Lead</option>
          <option value="deal">Create Deal</option>
          <option value="lead_deal">Create Lead + Deal</option>
          <option value="ticket">Create Support Ticket</option>
        </select>

        {form.crm.action !== "none" && (
          <div className="mt-3 space-y-1.5">
            <label className="block text-[11px] font-medium text-muted-foreground">If a record with this email already exists:</label>
            <select
              value={form.crm.duplicateAction ?? "update"}
              onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, duplicateAction: e.target.value as never } })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            >
              <option value="update">Update existing record</option>
              <option value="create_anyway">Create new record anyway</option>
              <option value="skip">Do nothing (skip)</option>
            </select>
            {(form.crm.duplicateAction ?? "update") === "update" && (
              <p className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-800">
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
                    <div className="bg-muted/60 px-2 py-1.5">Form Field</div>
                    <div className="bg-muted/60 px-2 py-1.5">Lead Property</div>
                  </div>
                  <div className="divide-y divide-border">
                    {includedFields.map((f) => (
                      <div key={f.id} className="grid grid-cols-2 gap-px bg-border">
                        <div className="flex items-center bg-background px-2 py-1.5 text-[11px] font-medium truncate">{f.displayName}</div>
                        <div className="bg-background px-1.5 py-1">
                          <select
                            value={form.crm.fieldMap[f.id] ?? ""}
                            onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, fieldMap: { ...form.crm.fieldMap, [f.id]: e.target.value } } })}
                            className="w-full rounded border border-border bg-background px-1.5 py-1 text-[11px]"
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
                <Labeled label="Set Lead Status">
                  <select value={form.crm.defaultLeadStatus || "New"} onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, defaultLeadStatus: e.target.value } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
                    {["New", "Prospect", "Qualified", "Won", "Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Labeled>
              </>
            )}
            {(form.crm.action === "deal" || form.crm.action === "lead_deal") && (
              <Labeled label="Set Deal Stage">
                <select value={form.crm.defaultDealStage || "Discovery"} onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, defaultDealStage: e.target.value } })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
                  {["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Labeled>
            )}
            {form.crm.action === "ticket" && (
              <>
                <div className="rounded-lg border border-border bg-background overflow-hidden">
                  <div className="grid grid-cols-2 gap-px bg-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <div className="bg-muted/60 px-2 py-1.5">Form Field</div>
                    <div className="bg-muted/60 px-2 py-1.5">Ticket Property</div>
                  </div>
                  <div className="divide-y divide-border">
                    {includedFields.map((f) => (
                      <div key={f.id} className="grid grid-cols-2 gap-px bg-border">
                        <div className="flex items-center bg-background px-2 py-1.5 text-[11px] font-medium truncate">{f.displayName}</div>
                        <div className="bg-background px-1.5 py-1">
                          <select
                            value={form.crm.fieldMap[f.id] ?? ""}
                            onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, fieldMap: { ...form.crm.fieldMap, [f.id]: e.target.value } } })}
                            className="w-full rounded border border-border bg-background px-1.5 py-1 text-[11px]"
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
                <p className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-800">
                  Ticket will be created in the Claims module and assigned to the Support team.
                </p>
              </>
            )}
            {form.crm.action !== "ticket" && (
              <p className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                Status will not be moved backward if the record is already at a later stage.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Contact Matching */}
      <div className="mt-4 border-t border-border pt-4">
        <button onClick={() => setContactMatchOpen((o) => !o)} className="flex w-full items-center justify-between text-sm font-semibold">
          Contact Matching
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${contactMatchOpen ? "rotate-180" : ""}`} />
        </button>
        {contactMatchOpen && (
          <div className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <div className="text-[11px] font-medium text-muted-foreground">Match submissions to existing records by:</div>
              {([
                { key: "matchByEmail", label: "Email address", defaultOn: true },
                { key: "matchByCompany", label: "Company name", defaultOn: false },
                { key: "matchByPhone", label: "Phone number", defaultOn: false },
              ] as const).map(({ key, label, defaultOn }) => (
                <label key={key} className="flex items-center gap-2 text-sm">
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
            <Labeled label="When a match is found:">
              <select
                value={form.crm.matchFoundAction ?? "link"}
                onChange={(e) => store.updateForm(form.id, { crm: { ...form.crm, matchFoundAction: e.target.value as never } })}
                className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
              >
                <option value="link">Link submission to existing record</option>
                <option value="link_update">Link and update record fields</option>
                <option value="ignore">Ignore match (always create new)</option>
              </select>
            </Labeled>
            <p className="rounded-md border border-border bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              Kai will also run duplicate detection on new record creation.
            </p>
          </div>
        )}
      </div>
    </div>
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
            The Sales Rep assigned to the Lead/Customer (via auto-assign or existing record) will receive an email notification with the submitted form data.
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
