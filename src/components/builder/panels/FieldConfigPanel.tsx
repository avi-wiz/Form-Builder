import { useState } from "react";
import { ChevronDown, ChevronRight, X, EyeOff, GripVertical, Plus, Info } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Toggle } from "@/components/ui-kit";
import { WidthSegment } from "../FieldCard";
import { FIELD_TYPE_META, useStore, type FieldType, type FieldWidth, type Form, type FormField, type FieldOption, type ConditionOperator, type VisibilityConditions } from "@/lib/forms-store";
import { CRM_PROPERTIES, PROPERTY_GROUPS, getEntityLabel, type EntityType } from "@/lib/crm-catalog";

const OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "is_blank", label: "is blank" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than", label: "less than" },
];

export function FieldConfigPanel({ form, sectionId, field, allFields, onDelete }: { form: Form; sectionId: string; field: FormField; allFields: { id: string; name: string }[]; onDelete: () => void }) {
  const store = useStore();
  const update = (patch: Partial<FormField>) => store.updateField(form.id, sectionId, field.id, patch);

  // The catalog property this field is linked to (if any) — drives the badge
  // label and the ℹ️ help tooltips for wholesale-specific concepts.
  const linkedProp = field.propertyId ? CRM_PROPERTIES.find((p) => p.id === field.propertyId) : undefined;

  return (
    <div className="space-y-3">
      {field.propertyId && (
        <div className="flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] text-blue-800">
          {linkedProp ? (
            <span>Linked to <span className="font-semibold">{getEntityLabel(linkedProp.entity)} → {linkedProp.label}</span></span>
          ) : (
            <span>Linked to property: <span className="font-mono">{field.propertyId}</span></span>
          )}
          {linkedProp?.helpText && (
            <span title={linkedProp.helpText} className="shrink-0 cursor-help text-blue-500"><Info className="h-3 w-3" /></span>
          )}
        </div>
      )}

      <Collapsible title="Field Settings" defaultOpen>
        <Labeled label="Display Name">
          <input value={field.displayName} onChange={(e) => update({ displayName: e.target.value })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none" />
        </Labeled>
        <Labeled label="Type">
          <select value={field.type} onChange={(e) => update({ type: e.target.value as FieldType })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm">
            {(Object.keys(FIELD_TYPE_META) as FieldType[]).map((t) => <option key={t} value={t}>{FIELD_TYPE_META[t].label}</option>)}
          </select>
        </Labeled>
        {field.type === "lookup" && (
          <Labeled label="Lookup Entity">
            <select
              value={field.lookupEntity ?? ""}
              onChange={(e) => update({ lookupEntity: (e.target.value || undefined) as EntityType | undefined })}
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            >
              <option value="">— Select entity —</option>
              {PROPERTY_GROUPS.map((g) => <option key={g.entity} value={g.entity}>{g.label}</option>)}
            </select>
          </Labeled>
        )}
        {field.type !== "hidden" && (
          <Labeled label="Placeholder">
            <input value={field.placeholder ?? ""} onChange={(e) => update({ placeholder: e.target.value })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
          </Labeled>
        )}
        <Labeled label="Help text">
          <textarea value={field.helpText ?? ""} onChange={(e) => update({ helpText: e.target.value })} rows={2} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
        </Labeled>
        <ToggleRow label="Required" checked={field.required} onChange={(v) => update({ required: v })} />
        <ToggleRow label="Hidden" checked={field.type === "hidden"} onChange={(v) => update({ type: v ? "hidden" : "text" })} />
        <ToggleRow label="Include in form" checked={field.included} onChange={(v) => update({ included: v })} />
        <ToggleRow label="Include in Quick Add" checked={field.included} onChange={(v) => update({ included: v })} />
      </Collapsible>

      <Collapsible title="Appearance">
        <Labeled label="Width">
          <WidthSegment current={field.width ?? "full"} onChange={(w: FieldWidth) => update({ width: w })} />
        </Labeled>
      </Collapsible>

      {(field.type === "text" || field.type === "long_text" || field.type === "email" || field.type === "url" || field.type === "phone") && (
        <Collapsible title="Validation">
          <div className="flex gap-2">
            <Labeled label="Min length" className="flex-1">
              <input
                type="number" min={0}
                value={field.minLength ?? ""}
                onChange={(e) => update({ minLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="—"
                className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
              />
            </Labeled>
            <Labeled label="Max length" className="flex-1">
              <input
                type="number" min={0}
                value={field.maxLength ?? ""}
                onChange={(e) => update({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="—"
                className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
              />
            </Labeled>
          </div>
          {field.type === "text" || field.type === "long_text" ? (
            <Labeled label="Pattern (regex)">
              <input
                value={field.validationPattern ?? ""}
                onChange={(e) => update({ validationPattern: e.target.value || undefined })}
                placeholder="e.g. ^[A-Z].*"
                className="w-full rounded-md border border-border px-2.5 py-1.5 font-mono text-sm"
              />
            </Labeled>
          ) : null}
          <Labeled label="Custom error message">
            <input
              value={field.validationMessage ?? ""}
              onChange={(e) => update({ validationMessage: e.target.value || undefined })}
              placeholder="This field is invalid"
              className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm"
            />
          </Labeled>
        </Collapsible>
      )}

      {field.type === "hidden" && (
        <Collapsible title="Hidden Field Config" defaultOpen>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <EyeOff className="h-3 w-3" /> Hidden from users
          </div>
          <Labeled label="Default value">
            <input value={field.defaultValue ?? ""} onChange={(e) => update({ defaultValue: e.target.value || undefined })} placeholder="e.g. tradeshow" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
          </Labeled>
          <ToggleRow label="Capture from URL parameter" checked={!!field.captureFromUrl} onChange={(v) => update({ captureFromUrl: v, urlParamName: v ? (field.urlParamName ?? "") : undefined })} />
          {field.captureFromUrl && (
            <Labeled label="URL parameter name">
              <input value={field.urlParamName ?? ""} onChange={(e) => update({ urlParamName: e.target.value })} placeholder="utm_source" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
            </Labeled>
          )}
        </Collapsible>
      )}

      {field.type === "consent" && (
        <Collapsible title="Consent Configuration" defaultOpen>
          <Labeled label="Consent text">
            <textarea value={field.consentText ?? ""} onChange={(e) => update({ consentText: e.target.value })} rows={3} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
          </Labeled>
          <Labeled label="Privacy Policy URL">
            <input value={field.privacyUrl ?? ""} onChange={(e) => update({ privacyUrl: e.target.value })} placeholder="https://example.com/privacy" className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
          </Labeled>
        </Collapsible>
      )}

      {field.type === "currency" && (
        <Collapsible title="Budget Range">
          <div className="flex gap-2">
            <Labeled label="Min ($)" className="flex-1">
              <input type="number" value={field.budgetMin ?? ""} onChange={(e) => update({ budgetMin: e.target.value || undefined })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
            </Labeled>
            <Labeled label="Max ($)" className="flex-1">
              <input type="number" value={field.budgetMax ?? ""} onChange={(e) => update({ budgetMax: e.target.value || undefined })} className="w-full rounded-md border border-border px-2.5 py-1.5 text-sm" />
            </Labeled>
          </div>
        </Collapsible>
      )}

      {(field.type === "select" || field.type === "multi_select" || field.type === "radio") && (
        <Collapsible title="Options" defaultOpen>
          <OptionsList options={field.options ?? []} onChange={(opts) => update({ options: opts })} />
          <ToggleRow label="Allow Other with text field" checked={!!field.allowOther} onChange={(v) => update({ allowOther: v })} />
        </Collapsible>
      )}

      <ConditionsBlock title="Visibility Conditions" conditions={field.conditions} onChange={(c) => update({ conditions: c.rules.length === 0 ? undefined : c })} allFields={allFields} hint="Field is always shown. Add a condition to control when it appears." />
      <ConditionsBlock title="Conditional Validation (required when)" conditions={field.requiredWhen} onChange={(c) => update({ requiredWhen: c.rules.length === 0 ? undefined : c })} allFields={allFields} hint="Field is only required when these conditions are met." />

      <button
        onClick={() => { store.removeField(form.id, sectionId, field.id); onDelete(); }}
        className="mt-3 w-full rounded-md border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/5"
      >
        Delete field
      </button>
    </div>
  );
}

function OptionsList({ options, onChange }: { options: FieldOption[]; onChange: (opts: FieldOption[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const ids = options.map((_, i) => String(i));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = Number(active.id);
    const to = Number(over.id);
    onChange(arrayMove(options, from, to));
  };

  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {options.map((opt, i) => (
            <SortableOption
              key={i}
              id={String(i)}
              opt={opt}
              onChange={(patch) => { const o = [...options]; o[i] = { ...o[i], ...patch }; onChange(o); }}
              onDelete={() => onChange(options.filter((_, j) => j !== i))}
            />
          ))}
        </SortableContext>
      </DndContext>
      <button
        onClick={() => onChange([...options, { label: "New option", value: "opt" + (options.length + 1) }])}
        className="text-[11px] text-primary hover:underline"
      >
        + Add option
      </button>
    </div>
  );
}

function SortableOption({ id, opt, onChange, onDelete }: { id: string; opt: FieldOption; onChange: (p: Partial<FieldOption>) => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-1"
    >
      <span {...attributes} {...listeners} className="cursor-grab text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <input value={opt.label} onChange={(e) => onChange({ label: e.target.value })} className="flex-1 rounded border border-border px-2 py-1 text-xs" placeholder="Label" />
      <input value={opt.value} onChange={(e) => onChange({ value: e.target.value })} className="w-20 rounded border border-border px-2 py-1 text-xs" placeholder="Value" />
      <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-md border border-border bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold">
        <span>{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && <div className="border-t border-border p-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Labeled({ label, children, className = "", info }: { label: string; children: React.ReactNode; className?: string; info?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        {label}
        {info && <span title={info} className="inline-flex cursor-help"><Info className="h-3 w-3 text-muted-foreground/70" /></span>}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span>{label}</span>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function ConditionsBlock({ title, conditions, onChange, allFields, hint }: { title: string; conditions: VisibilityConditions | undefined; onChange: (c: VisibilityConditions) => void; allFields: { id: string; name: string }[]; hint: string }) {
  const [open, setOpen] = useState((conditions?.rules.length ?? 0) > 0);
  const cur: VisibilityConditions = conditions ?? { logic: "AND", rules: [] };
  const updateRule = (i: number, patch: Partial<{ fieldId: string; operator: ConditionOperator; value: string }>) => {
    onChange({ ...cur, rules: cur.rules.map((r, idx) => idx === i ? { ...r, ...patch } : r) });
  };
  const addRule = () => {
    onChange({ logic: cur.logic, rules: [...cur.rules, { fieldId: allFields[0]?.id ?? "", operator: "equals", value: "" }] });
    setOpen(true);
  };
  const removeRule = (i: number) => onChange({ ...cur, rules: cur.rules.filter((_, idx) => idx !== i) });

  return (
    <div className="rounded-md border border-border bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold">
        <span className="flex items-center gap-1.5">{title}{cur.rules.length > 0 && <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-700">{cur.rules.length}</span>}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="border-t border-border p-3 space-y-2">
          {cur.rules.length === 0 && <p className="text-[11px] text-muted-foreground">{hint}</p>}
          {cur.rules.map((r, i) => (
            <div key={i} className="space-y-1.5">
              {i > 0 && (
                <div className="flex w-fit items-center gap-1 rounded border border-border bg-muted p-0.5 text-[10px] font-semibold">
                  {(["AND", "OR"] as const).map((op) => (
                    <button key={op} onClick={() => onChange({ ...cur, logic: op })} className={`rounded px-1.5 py-0.5 ${cur.logic === op ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{op}</button>
                  ))}
                </div>
              )}
              <div className="flex items-start gap-1 rounded border border-border bg-card p-2">
                <div className="grid flex-1 gap-1">
                  <select value={r.fieldId} onChange={(e) => updateRule(i, { fieldId: e.target.value })} className="w-full rounded border border-border bg-background px-1.5 py-1 text-xs">
                    {allFields.length === 0 && <option value="">— No other fields —</option>}
                    {allFields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  <select value={r.operator} onChange={(e) => updateRule(i, { operator: e.target.value as ConditionOperator })} className="w-full rounded border border-border bg-background px-1.5 py-1 text-xs">
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {r.operator !== "is_blank" && (
                    <input value={r.value} onChange={(e) => updateRule(i, { value: e.target.value })} placeholder="Value" className="w-full rounded border border-border bg-background px-1.5 py-1 text-xs" />
                  )}
                </div>
                <button onClick={() => removeRule(i)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"><X className="h-3 w-3" /></button>
              </div>
            </div>
          ))}
          <button onClick={addRule} className="inline-flex items-center gap-1 rounded border border-dashed border-border px-2 py-1 text-[11px] font-medium text-primary hover:bg-primary/5">
            <Plus className="h-3 w-3" /> Add Condition
          </button>
        </div>
      )}
    </div>
  );
}
