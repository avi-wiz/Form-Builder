import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useStore, type Form } from "@/lib/forms-store";
import { LeftPanelFields } from "./LeftPanelFields";
import { LeftPanelProperties } from "./LeftPanelProperties";
import { LeftPanelOther } from "./LeftPanelOther";

type Tab = "fields" | "properties" | "other";

export function LeftPanel({ form }: { form: Form }) {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("fields");
  const [query, setQuery] = useState("");

  return (
    <aside className="flex w-[280px] shrink-0 flex-col border-r border-border bg-[#F9FAFB]">
      <div className="flex items-center gap-1 border-b border-border px-3 pt-3">
        <TabBtn active={tab === "fields"} onClick={() => setTab("fields")}>Fields</TabBtn>
        <TabBtn active={tab === "properties"} onClick={() => setTab("properties")}>Properties</TabBtn>
        <TabBtn active={tab === "other"} onClick={() => setTab("other")}>Other</TabBtn>
      </div>
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border border-border bg-white pl-8 pr-3 py-1.5 text-xs focus:border-primary focus:outline-none"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "fields" && <LeftPanelFields form={form} query={query} />}
        {tab === "properties" && <LeftPanelProperties query={query} />}
        {tab === "other" && <LeftPanelOther />}
      </div>
      <div className="border-t border-border bg-white p-3">
        <button
          onClick={() => store.addSection(form.id)}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border bg-white px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          <Plus className="h-4 w-4" /> Add Section
        </button>
      </div>
    </aside>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px flex-1 border-b-2 px-2 py-2 text-xs font-medium ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}
