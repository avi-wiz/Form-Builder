import { useEffect, useRef, useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, pointerWithin, rectIntersection, closestCenter, DragOverlay, type DragStartEvent, type DragEndEvent, type CollisionDetection } from "@dnd-kit/core";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Sparkles, Check } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, SlideOver } from "@/components/ui-kit";
import { useStore, DEFAULT_FORM_STYLE, type FormStyle, type Form } from "@/lib/forms-store";
import { CRM_PROPERTIES } from "@/lib/crm-catalog";
import { setupFormDefaults, snapshotForm, restoreForm, type SetupSummary, type FormSnapshot } from "@/lib/kaiActions";
import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { Canvas } from "./Canvas";
import { RightPanel } from "./RightPanel";
import { handleDragEnd } from "./dnd-helpers";
import type { Selection, DragData } from "./types";

// Custom collision: cursor-inside wins over closest-corner. Within the set of
// droppables the cursor is inside, prefer the most specific "narrow" zones
// (between-sections / between-rows / row-slot) so users can reliably target the
// thin indicator strips even when a larger section card overlaps.
const PRIORITY_ID_PREFIXES = ["between-", "top-", "after-", "btw-", "slot-"];
const canvasCollisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args);
  if (pointer.length > 0) {
    const priority = pointer.filter((c) => PRIORITY_ID_PREFIXES.some((p) => String(c.id).startsWith(p)));
    if (priority.length > 0) return priority;
    return pointer;
  }
  const rects = rectIntersection(args);
  if (rects.length > 0) return rects;
  return closestCenter(args);
};

export function BuilderShell({ formId }: { formId: string }) {
  const store = useStore();
  const form = store.getForm(formId);
  const [selected, setSelected] = useState<Selection>({ kind: "none" });
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  if (!form) {
    return (
      <AppShell breadcrumb={[{ label: "Forms", to: "/forms" }, { label: "Not found" }]}>
        <div className="p-8 text-center text-muted-foreground">
          Form not found. <Link to="/forms" className="text-primary">Back to Forms</Link>
        </div>
      </AppShell>
    );
  }

  const style: FormStyle = form.style ?? DEFAULT_FORM_STYLE;
  const fontStack =
    style.fontFamily === "Inter" ? "Inter, system-ui, sans-serif" :
    style.fontFamily === "Roboto" ? "Roboto, system-ui, sans-serif" :
    style.fontFamily === "Open Sans" ? '"Open Sans", system-ui, sans-serif' :
    "system-ui, -apple-system, sans-serif";

  const onStart = (e: DragStartEvent) => setActiveDrag((e.active.data.current as DragData | undefined) ?? null);
  const onEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    handleDragEnd(e, form, {
      addRow: store.addRow, removeRow: store.removeRow, moveRow: store.moveRow,
      addFieldToRow: store.addFieldToRow, moveFieldBetweenRows: store.moveFieldBetweenRows,
      moveFieldToNewRow: store.moveFieldToNewRow,
      reorderSections: store.reorderSections,
    }, store.customProperties);
  };

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }]}>
      <DndContext sensors={sensors} collisionDetection={canvasCollisionDetection} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveDrag(null)}>
        <div className="flex h-full flex-col">
          <TopBar form={form} />
          <KaiSetupBanner form={form} />
          <div className="flex min-h-0 flex-1">
            <LeftPanel form={form} />
            <Canvas form={form} selected={selected} setSelected={setSelected} fontStack={fontStack} />
            <RightPanel form={form} selected={selected} setSelected={setSelected} />
          </div>
        </div>
        <DragOverlay>
          {activeDrag ? <DragGhost data={activeDrag} /> : null}
        </DragOverlay>
      </DndContext>
    </AppShell>
  );
}

// Tracks which forms have already had smart-setup run this session, so it runs
// exactly once even across builder remounts (independent of the persisted flag).
const kaiSetupRan = new Set<string>();

function KaiSetupBanner({ form }: { form: Form }) {
  const store = useStore();
  const [summary, setSummary] = useState<SetupSummary | null>(null);
  const [inspect, setInspect] = useState(false);
  const snapRef = useRef<FormSnapshot | null>(null);

  // First open of a form Kai hasn't set up yet → run setup, capture undo snapshot.
  useEffect(() => {
    if (form.kaiSetupShown || kaiSetupRan.has(form.id)) return;
    kaiSetupRan.add(form.id);
    snapRef.current = snapshotForm(form);
    setSummary(setupFormDefaults(store, form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.id]);

  if (form.kaiSetupShown || !summary) return null;

  const confirm = () => { store.updateForm(form.id, { kaiSetupShown: true }); setSummary(null); };
  const undo = () => {
    if (snapRef.current) restoreForm(store, form.id, snapRef.current);
    store.updateForm(form.id, { kaiSetupShown: true });
    setSummary(null);
    toast("Reverted Kai's setup.");
  };

  return (
    <>
      <div className="border-b border-purple-200 bg-purple-50 px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-col gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-purple-800">
            <Sparkles className="h-4 w-4" /> Kai set this form up for you:
          </div>
          <ul className="space-y-0.5 text-[12px] text-purple-800">
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0" /> Action: {summary.actionLabel}{summary.defaultsText ? ` (${summary.defaultsText})` : ""}</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0" /> Duplicate matching: {summary.matchSummary}</li>
            <li className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0" /> Mapped {summary.mappedCount} field{summary.mappedCount === 1 ? "" : "s"} automatically</li>
            {summary.automationText && <li className="flex items-center gap-1.5"><Check className="h-3 w-3 shrink-0" /> Applied recommended automation ({summary.automationText})</li>}
          </ul>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Btn size="sm" onClick={confirm}>Looks good</Btn>
            <button onClick={() => setInspect(true)} className="text-xs font-medium text-purple-700 hover:underline">Show me what changed</button>
            <button onClick={undo} className="text-xs font-medium text-purple-700 hover:underline">Undo all</button>
          </div>
        </div>
      </div>

      <SlideOver open={inspect} onClose={() => setInspect(false)} title="What Kai changed" width={460}>
        <div className="space-y-4 text-sm">
          <InspectItem where="Submission tab → CRM Action" label="Action" value={`${summary.actionLabel}${summary.defaultsText ? ` · ${summary.defaultsText}` : ""}`} />
          <InspectItem where="Submission tab → Advanced settings → Record Matching" label="Duplicate matching" value={summary.matchSummary} />
          <InspectItem where="Submission tab → Field Mapping" label="Auto-mapped fields" value={`${summary.mappedCount} field(s) linked to entity properties`} />
          {summary.automationText && <InspectItem where="Automation tab → Quick Automation" label="Recommended automation" value={summary.automationText} />}
        </div>
      </SlideOver>
    </>
  );
}

function InspectItem({ where, label, value }: { where: string; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm text-foreground">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">Lives in: {where}</div>
    </div>
  );
}

function DragGhost({ data }: { data: DragData }) {
  let label = "Dragging";
  if (data.source === "libraryProperty") {
    const p = CRM_PROPERTIES.find((x) => x.id === data.propertyId);
    label = p?.label ?? data.propertyId;
  } else if (data.source === "libraryField") {
    label = data.displayName;
  } else if (data.source === "libraryElement") {
    label = data.elementKind;
  } else if (data.source === "row") {
    label = "Row";
  } else if (data.source === "field") {
    label = "Field";
  } else if (data.source === "section") {
    label = "Section";
  }
  return (
    <div className="rounded-md border border-primary/60 bg-card px-3 py-2 text-sm font-medium text-foreground shadow-lg opacity-90">
      {label}
    </div>
  );
}
