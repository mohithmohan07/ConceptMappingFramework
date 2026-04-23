import type { FlowTab } from "./types";

const TAB_INFO: Array<{ id: FlowTab; label: string; description: string }> = [
  { id: "focus-gaps", label: "Focus Gaps Flow Chart", description: "Chapter → Topic → Parent Concept → Concept" },
  { id: "library", label: "Library Flow Chart", description: "Parent Concept → Concepts library map" },
  { id: "curriculum", label: "Curriculum Flow Chart", description: "Chapter → Topics curriculum sequencing" },
  { id: "concept-overview", label: "Concepts Overview", description: "Concept-first network with lineage tracing" },
];

export function FlowChartTabs({ activeTab, onTabChange }: { activeTab: FlowTab; onTabChange: (tab: FlowTab) => void }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
      {TAB_INFO.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`rounded-xl border p-3 text-left transition ${
            activeTab === tab.id
              ? "border-indigo-300 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-900 shadow-sm"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <p className="text-sm font-semibold">{tab.label}</p>
          <p className="mt-1 text-xs opacity-80">{tab.description}</p>
        </button>
      ))}
    </div>
  );
}
