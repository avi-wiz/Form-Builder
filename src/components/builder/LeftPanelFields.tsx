import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, ChevronUp, Sparkles, Check } from "lucide-react";
import { useStore, getSectionFields, type Form } from "@/lib/forms-store";
import { CRM_PROPERTIES, PROPERTY_GROUPS, entityBadgeClasses, type CrmPropertySeed } from "@/lib/crm-catalog";
import type { DragData } from "./types";

export function LeftPanelFields({ form, query }: { form: Form; query: string }) {
  const store = useStore();
  const allProps = useMemo(() => [...CRM_PROPERTIES, ...store.customProperties], [store.customProperties]);
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

  // Wholesale-relevant Kai suggestions. Each rule fires when its `when()`
  // condition holds; we surface only the first (most relevant) non-dismissed
  // suggestion. Clicking "Dismiss" hides it and the next applicable one shows.
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const kaiSuggestion = useMemo(() => {
    const action = form.crm.action;
    const has = (id: string) => usedPropertyIds.has(id);
    const hasAnyOf = (prefix: string) => [...usedPropertyIds].some((id) => id.startsWith(prefix));
    const businessTypeVal = fieldsInForm.find((f) => f.type === "select" && /business type/i.test(f.displayName));
    // Default value chosen for business_type, if the form pre-sets one.
    const businessTypeDefault = String(form.crm.defaults["retailer.business_type"] ?? "");

    const rules: { id: string; text: string }[] = [];

    if (has("retailer.legal_name") && has("retailer.ein") && !has("retailer.payment_terms")) {
      rules.push({ id: "fin-qual", text: "Add Payment Terms and Credit Limit to capture financial qualification upfront." });
    }
    if (hasAnyOf("order.") && !has("order.delivery_window")) {
      rules.push({ id: "delivery", text: "Add Delivery Preferences — retailers often need lift-gate, appointment scheduling, or white-glove delivery." });
    }
    if (action === "create_quote" && !has("quote.expiry_date")) {
      rules.push({ id: "quote-expiry", text: "Add Quote Expiry Date — un-expiring quotes are a common source of pricing disputes." });
    }
    if (hasAnyOf("retailer.") && !has("retailer.primary_rep")) {
      rules.push({ id: "primary-rep", text: "Add Primary Rep assignment so submissions are auto-routed." });
    }
    if (action === "create_credit_application" && !hasAnyOf("credit_application.trade_ref_")) {
      rules.push({ id: "trade-refs", text: "Add 2–3 Trade References — standard for credit vetting." });
    }
    if (businessTypeDefault === "interior_designer" || businessTypeDefault === "hospitality"
        || !!businessTypeVal) {
      if (!has("retailer.minimum_annual_commitment") || !has("retailer.exclusivity_type")) {
        rules.push({ id: "specialty", text: "Add Minimum Annual Commitment and Exclusivity Type for specialty accounts." });
      }
    }
    if (action === "create_claim" && !hasAnyOf("claim.claim_line_")) {
      rules.push({ id: "claim-lines", text: "Add Claim Line Items so buyers can specify each affected SKU with photos." });
    }

    return rules.find((r) => !dismissed.has(r.id)) ?? null;
  }, [form.crm.action, form.crm.defaults, usedPropertyIds, fieldsInForm, dismissed]);

  const q = query.trim().toLowerCase();
  const matches = (p: CrmPropertySeed) => !q || p.label.toLowerCase().includes(q) || p.group.toLowerCase().includes(q);

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

      {/* Kai suggestion banner — one wholesale-relevant tip at a time */}
      {kaiSuggestion && (
        <div className="rounded-md border border-purple-200 bg-purple-50 p-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-purple-800">
            <Sparkles className="h-3.5 w-3.5" /> Kai suggests
          </div>
          <p className="text-[11px] leading-relaxed text-purple-700">{kaiSuggestion.text}</p>
          <button
            onClick={() => setDismissed((prev) => new Set(prev).add(kaiSuggestion.id))}
            className="mt-2 text-[11px] font-medium text-purple-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Createable entities */}
      <Section title="Createable entities" defaultOpen>
        <div className="space-y-4">
          {PROPERTY_GROUPS.filter((g) => !g.referenceOnly).map((group) => (
            <EntityBlock key={group.entity} group={group} allProps={allProps} matches={matches} usedPropertyIds={usedPropertyIds} searching={!!q} />
          ))}
        </div>
      </Section>

      {/* Reference-only entities — dimmer, collapsed by default */}
      <Section title="Reference-only entities">
        <div className="space-y-4 opacity-70">
          {PROPERTY_GROUPS.filter((g) => g.referenceOnly).map((group) => (
            <EntityBlock key={group.entity} group={group} allProps={allProps} matches={matches} usedPropertyIds={usedPropertyIds} searching={!!q} />
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

function EntityBlock({
  group,
  allProps,
  matches,
  usedPropertyIds,
  searching,
}: {
  group: (typeof PROPERTY_GROUPS)[number];
  allProps: CrmPropertySeed[];
  matches: (p: CrmPropertySeed) => boolean;
  usedPropertyIds: Set<string>;
  searching: boolean;
}) {
  // Per-entity, per-session view mode. Default "recommended" (commonly-used only).
  const [viewMode, setViewMode] = useState<"recommended" | "all">("recommended");

  const entityProps = allProps.filter((p) => p.entity === group.entity && matches(p));
  if (entityProps.length === 0) return null;

  const recommended = entityProps.filter((p) => p.commonlyUsed);
  // Small entities (≤10 props) and those with no commonly-used flags just show
  // everything — the toggle adds friction with no payoff. Search also bypasses
  // the toggle so a query can reach every matching property.
  const useToggle = !searching && recommended.length > 0 && entityProps.length > 10;
  const showAll = !useToggle || viewMode === "all";
  const hiddenCount = entityProps.length - recommended.length;

  const subGroups = (
    <>
      {group.subGroups.map((sub) => {
        const props = entityProps.filter((p) => p.group === sub);
        if (props.length === 0) return null;
        return (
          <PropertyGroup key={group.entity + ":" + sub} groupName={sub} properties={props} usedIds={usedPropertyIds} />
        );
      })}
    </>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-0.5">
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${entityBadgeClasses(group.entity)}`}>
          {group.label}
        </span>
      </div>

      {showAll ? (
        subGroups
      ) : (
        <ul className="rounded-md border border-border bg-white p-1.5 space-y-1">
          {recommended.map((p) => <PropertyItem key={p.id} property={p} inUse={usedPropertyIds.has(p.id)} compact={false} />)}
        </ul>
      )}

      {useToggle && (
        <button
          onClick={() => setViewMode((m) => (m === "all" ? "recommended" : "all"))}
          className="flex w-full items-center justify-center gap-0.5 px-1 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {viewMode === "all"
            ? <>Show less <ChevronUp className="h-3 w-3" /></>
            : <>Show all ({hiddenCount} more) <ChevronDown className="h-3 w-3" /></>}
        </button>
      )}
    </div>
  );
}

function PropertyGroup({ groupName, properties, usedIds }: { groupName: string; properties: CrmPropertySeed[]; usedIds: Set<string> }) {
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
          {properties.map((p) => <PropertyItem key={p.id} property={p} inUse={usedIds.has(p.id)} compact />)}
        </ul>
      )}
    </div>
  );
}

function PropertyItem({ property, inUse, compact }: { property: CrmPropertySeed; inUse: boolean; compact?: boolean }) {
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
      className={`flex items-center gap-2 rounded-md border border-transparent px-2 text-xs ${compact ? "py-1.5" : "py-2"} ${inUse ? "opacity-50" : "cursor-grab hover:border-primary/40 hover:bg-primary/5 active:cursor-grabbing"} ${isDragging ? "opacity-30" : ""}`}
    >
      {property.commonlyUsed && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" title="Commonly used" />}
      <span className="flex-1 truncate font-medium text-foreground">{property.label}</span>
      {property.helpText && <span className="shrink-0 text-muted-foreground" title={property.helpText}>ℹ️</span>}
      {inUse && <Check className="h-3 w-3 shrink-0 text-green-600" />}
    </li>
  );
}

