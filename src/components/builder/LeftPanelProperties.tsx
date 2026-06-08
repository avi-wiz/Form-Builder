import { useMemo, useState } from "react";
import { Plus, X, ChevronDown, ChevronRight } from "lucide-react";
import { useStore, FIELD_TYPE_META, type FieldType, type FieldOption } from "@/lib/forms-store";
import { CRM_PROPERTIES, PROPERTY_GROUPS, entityBadgeClasses, type EntityType, type CrmPropertySeed } from "@/lib/crm-catalog";

export function LeftPanelProperties({ query }: { query: string }) {
  const store = useStore();
  const [creating, setCreating] = useState(false);
  const allProps = useMemo(() => [...CRM_PROPERTIES, ...store.customProperties], [store.customProperties]);
  const q = query.trim().toLowerCase();

  return (
    <div className="p-3 space-y-3">
      <button
        onClick={() => setCreating((c) => !c)}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-primary/50 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10"
      >
        <Plus className="h-3.5 w-3.5" /> Create Property
      </button>

      {creating && <CreatePropertyForm onDone={() => setCreating(false)} />}

      {/* Createable entities (13) */}
      <Section title="Createable entities" defaultOpen>
        <div className="space-y-3">
          {PROPERTY_GROUPS.filter((g) => !g.referenceOnly).map((g) => (
            <EntityCard key={g.entity} group={g} allProps={allProps} q={q} />
          ))}
        </div>
      </Section>

      {/* Reference-only entities (6) — dimmer, collapsed by default */}
      <Section title="Reference-only entities">
        <div className="space-y-3 opacity-70">
          {PROPERTY_GROUPS.filter((g) => g.referenceOnly).map((g) => (
            <EntityCard key={g.entity} group={g} allProps={allProps} q={q} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {title}
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

function EntityCard({ group, allProps, q }: { group: (typeof PROPERTY_GROUPS)[number]; allProps: CrmPropertySeed[]; q: string }) {
  const entityProps = allProps.filter((p) => p.entity === group.entity && (!q || p.label.toLowerCase().includes(q)));
  if (entityProps.length === 0) return null;
  return (
    <div className="rounded-md border border-border bg-white p-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${entityBadgeClasses(group.entity)}`}>{group.label}</span>
        <span className="text-[11px] font-semibold text-muted-foreground">{entityProps.length}</span>
      </div>
      {group.subGroups.map((sub) => {
        const list = entityProps.filter((p) => p.group === sub);
        if (list.length === 0) return null;
        return (
          <div key={sub} className="mt-1">
            <div className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{sub}</div>
            <ul className="space-y-1">
              {list.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/50">
                  {p.commonlyUsed && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                  <span className="flex-1 truncate font-medium">{p.label}</span>
                  {p.helpText && <span className="text-muted-foreground" title={p.helpText}>ℹ️</span>}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

const CREATEABLE_GROUPS = PROPERTY_GROUPS.filter((g) => !g.referenceOnly);

function CreatePropertyForm({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const [label, setLabel] = useState("");
  const [entity, setEntity] = useState<EntityType>(CREATEABLE_GROUPS[0].entity);
  const subGroups = useMemo(() => CREATEABLE_GROUPS.find((g) => g.entity === entity)?.subGroups ?? [], [entity]);
  const [group, setGroup] = useState<string>(subGroups[0]);
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [options, setOptions] = useState<FieldOption[]>([{ label: "Option 1", value: "opt1" }]);

  const needsOptions = fieldType === "select" || fieldType === "multi_select" || fieldType === "radio";

  // Keep the selected sub-group valid when the entity changes.
  const onEntityChange = (e: EntityType) => {
    setEntity(e);
    const subs = CREATEABLE_GROUPS.find((g) => g.entity === e)?.subGroups ?? [];
    setGroup(subs[0]);
  };

  const submit = () => {
    if (!label.trim()) return;
    const id = "custom." + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const prop: CrmPropertySeed = {
      id, label: label.trim(), entity, group, defaultFieldType: fieldType,
      ...(needsOptions ? { options } : {}),
    };
    store.addCustomProperty(prop);
    onDone();
  };

  return (
    <div className="rounded-md border border-border bg-white p-3 space-y-2">
      <div className="text-xs font-semibold">New Property</div>
      <label className="block">
        <span className="block text-[11px] font-medium text-muted-foreground">Label</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Trade Show Booth" className="mt-1 w-full rounded border border-border px-2 py-1 text-xs focus:border-primary focus:outline-none" />
      </label>
      <label className="block">
        <span className="block text-[11px] font-medium text-muted-foreground">Entity</span>
        <select value={entity} onChange={(e) => onEntityChange(e.target.value as EntityType)} className="mt-1 w-full rounded border border-border px-2 py-1 text-xs">
          {CREATEABLE_GROUPS.map((g) => <option key={g.entity} value={g.entity}>{g.label}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-[11px] font-medium text-muted-foreground">Group</span>
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-1 w-full rounded border border-border px-2 py-1 text-xs">
          {subGroups.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div>
        <span className="block text-[11px] font-medium text-muted-foreground">Field Type</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {(["text", "long_text", "email", "phone", "number", "currency", "select", "multi_select", "radio", "date", "url", "checkbox"] as FieldType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFieldType(t)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${fieldType === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-foreground hover:border-primary/40"}`}
            >
              {FIELD_TYPE_META[t].label}
            </button>
          ))}
        </div>
      </div>
      {needsOptions && (
        <div>
          <span className="block text-[11px] font-medium text-muted-foreground">Options</span>
          <div className="mt-1 space-y-1">
            {options.map((o, i) => (
              <div key={i} className="flex items-center gap-1">
                <input value={o.label} onChange={(e) => setOptions(options.map((x, j) => j === i ? { ...x, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "_") } : x))} className="flex-1 rounded border border-border px-2 py-1 text-xs" placeholder="Label" />
                <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="rounded p-0.5 text-muted-foreground hover:bg-muted"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <button onClick={() => setOptions([...options, { label: "New", value: "opt" + (options.length + 1) }])} className="text-[11px] text-primary hover:underline">+ Add option</button>
          </div>
        </div>
      )}
      <div className="flex justify-end gap-1.5 pt-1">
        <button onClick={onDone} className="rounded border border-border px-2 py-1 text-xs">Cancel</button>
        <button onClick={submit} className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:opacity-90">Create</button>
      </div>
    </div>
  );
}
