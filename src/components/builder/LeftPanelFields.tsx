import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, Sparkles, Check } from "lucide-react";
import { useStore, getSectionFields, type Form } from "@/lib/forms-store";
import { CRM_PROPERTY_CATALOG, PROPERTY_GROUPS, objectTypeBadgeClasses, objectTypeLabel, type CrmProperty } from "@/lib/crm-catalog";
import type { DragData } from "./types";

export function LeftPanelFields({ form, query }: { form: Form; query: string }) {
  const store = useStore();
  const allProps = useMemo(() => [...CRM_PROPERTY_CATALOG, ...store.customProperties], [store.customProperties]);
  const usedPropertyIds = useMemo(() => {
    const ids = new Set<string>();
    for (const s of form.sections) for (const f of getSectionFields(s)) if (f.propertyId) ids.add(f.propertyId);
    return ids;
  }, [form]);

  const fieldsInForm = useMemo(() => {
    const arr: { sectionName: string; fieldId: string; displayName: string; type: string; sectionId: string; rowId: string }[] = [];
    for (const s of form.sections) {
      for (const r of s.rows) {
        if (r.kind === "fields" && r.fields) {
          for (const f of r.fields) arr.push({ sectionName: s.name, sectionId: s.id, rowId: r.id, fieldId: f.id, displayName: f.displayName, type: f.type });
        }
      }
    }
    return arr;
  }, [form]);

  // Kai suggestion: if Email and Company Name in form, but not Industry, suggest Industry / Company Size / Annual Revenue
  const kaiSuggestions = useMemo(() => {
    const hasEmail = usedPropertyIds.has("contact.email") || fieldsInForm.some((f) => f.type === "email" || /email/i.test(f.displayName));
    const hasCompany = usedPropertyIds.has("company.name") || fieldsInForm.some((f) => /company.*name|company name/i.test(f.displayName));
    const hasIndustry = usedPropertyIds.has("company.industry") || fieldsInForm.some((f) => /industry/i.test(f.displayName));
    if (hasEmail && hasCompany && !hasIndustry) {
      return ["company.industry", "company.size", "company.revenue"]
        .map((id) => allProps.find((p) => p.id === id))
        .filter((x): x is CrmProperty => !!x);
    }
    return [];
  }, [usedPropertyIds, fieldsInForm, allProps]);

  const q = query.trim().toLowerCase();
  const matches = (p: CrmProperty) => !q || p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q);

  return (
    <div className="p-3 space-y-4">
      {/* Fields in this form */}
      {fieldsInForm.length > 0 && (
        <Section title={`Fields in this form (${fieldsInForm.length})`} defaultOpen>
          <ul className="space-y-1">
            {fieldsInForm.filter((f) => !q || f.displayName.toLowerCase().includes(q)).map((f) => (
              <li key={f.fieldId} className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-xs">
                <span className="truncate font-medium text-foreground">{f.displayName}</span>
                <span className="text-[10px] text-muted-foreground">{f.sectionName}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Kai suggestion banner */}
      {kaiSuggestions.length > 0 && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-purple-800">
            <Sparkles className="h-3.5 w-3.5" /> Kai suggests
          </div>
          <p className="mb-2 text-[11px] text-purple-700">Forms like yours often include:</p>
          <div className="flex flex-wrap gap-1.5">
            {kaiSuggestions.map((p) => (
              <KaiSuggestionChip key={p.id} property={p} />
            ))}
          </div>
        </div>
      )}

      {/* Available fields grouped */}
      <Section title="Available fields" defaultOpen>
        <div className="space-y-3">
          {PROPERTY_GROUPS.map((group) => {
            const props = allProps.filter((p) => p.group === group.name && matches(p));
            if (props.length === 0) return null;
            return (
              <PropertyGroup key={group.name} groupName={group.name} properties={props} usedIds={usedPropertyIds} />
            );
          })}
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

function PropertyGroup({ groupName, properties, usedIds }: { groupName: string; properties: CrmProperty[]; usedIds: Set<string> }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-md border border-border bg-white">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-2.5 py-2 text-xs font-semibold">
        <span className="flex items-center gap-1">
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {groupName}
        </span>
        <span className="text-[10px] text-muted-foreground">{properties.length}</span>
      </button>
      {open && (
        <ul className="border-t border-border p-1.5 space-y-1">
          {properties.map((p) => <PropertyItem key={p.id} property={p} inUse={usedIds.has(p.id)} />)}
        </ul>
      )}
    </div>
  );
}

function PropertyItem({ property, inUse }: { property: CrmProperty; inUse: boolean }) {
  const dragData: DragData = { source: "libraryProperty", propertyId: property.id };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: "lib-prop-" + property.id,
    data: dragData,
    disabled: inUse,
  });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-xs ${inUse ? "opacity-50" : "cursor-grab hover:border-primary/40 hover:bg-primary/5 active:cursor-grabbing"} ${isDragging ? "opacity-30" : ""}`}
    >
      {property.commonlyUsed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Commonly used" />}
      <span className="flex-1 truncate font-medium text-foreground">{property.label}</span>
      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${objectTypeBadgeClasses(property.objectType)}`}>
        {objectTypeLabel(property.objectType)}
      </span>
      {inUse && <Check className="h-3 w-3 shrink-0 text-green-600" />}
    </li>
  );
}

function KaiSuggestionChip({ property }: { property: CrmProperty }) {
  const dragData: DragData = { source: "libraryProperty", propertyId: property.id };
  const { attributes, listeners, setNodeRef } = useDraggable({ id: "kai-" + property.id, data: dragData });
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-full border border-purple-300 bg-white px-2 py-1 text-[11px] font-medium text-purple-700 hover:bg-purple-100 active:cursor-grabbing"
    >
      + {property.label}
    </button>
  );
}
