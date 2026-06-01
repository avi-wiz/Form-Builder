import { useState } from "react";
import { DndContext, PointerSensor, useSensor, useSensors, closestCorners, DragOverlay, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { useStore, DEFAULT_FORM_STYLE, type FormStyle } from "@/lib/forms-store";
import { CRM_PROPERTY_CATALOG } from "@/lib/crm-catalog";
import { TopBar } from "./TopBar";
import { LeftPanel } from "./LeftPanel";
import { Canvas } from "./Canvas";
import { RightPanel } from "./RightPanel";
import { handleDragEnd } from "./dnd-helpers";
import type { Selection, DragData } from "./types";

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
      reorderSections: store.reorderSections,
    }, store.customProperties);
  };

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name }]}>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onStart} onDragEnd={onEnd} onDragCancel={() => setActiveDrag(null)}>
        <div className="flex h-full flex-col">
          <TopBar form={form} />
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

function DragGhost({ data }: { data: DragData }) {
  let label = "Dragging";
  if (data.source === "libraryProperty") {
    const p = CRM_PROPERTY_CATALOG.find((x) => x.id === data.propertyId);
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
