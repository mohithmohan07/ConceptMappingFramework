import { useMemo, useState } from "react";
import type { ParentConceptNode } from "../data/types";
import { normalizeConcepts, getFilterOptions } from "./flowchart/adapters";
import { DetailsPanel } from "./flowchart/DetailsPanel";
import { FlowChartTabs } from "./flowchart/FlowChartTabs";
import { FlowChartToolbar } from "./flowchart/FlowChartToolbar";
import { GraphCanvas } from "./flowchart/GraphCanvas";
import {
  buildConceptOverviewGraph,
  buildCurriculumGraph,
  buildFocusGapsGraph,
  buildLibraryGraph,
} from "./flowchart/graphBuilders";
import type { FlowFilters, FlowTab, GraphModel, Viewport } from "./flowchart/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

const DEFAULT_VIEWPORT: Viewport = { x: 80, y: 45, zoom: 0.85 };

function gatherConnectedNodeIds(graph: GraphModel, selectedNodeId: string | null) {
  if (!selectedNodeId) return new Set(graph.nodes.map((node) => node.id));
  const connected = new Set<string>([selectedNodeId]);
  graph.edges.forEach((edge) => {
    if (edge.source === selectedNodeId || edge.target === selectedNodeId) {
      connected.add(edge.source);
      connected.add(edge.target);
    }
  });
  return connected;
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<FlowTab>("focus-gaps");
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FlowFilters>({
    grade: "",
    subject: "",
    chapter: "",
    parentConcept: "",
  });

  const [viewportByTab, setViewportByTab] = useState<Record<FlowTab, Viewport>>({
    "focus-gaps": DEFAULT_VIEWPORT,
    library: DEFAULT_VIEWPORT,
    curriculum: DEFAULT_VIEWPORT,
    "concept-overview": DEFAULT_VIEWPORT,
  });

  const concepts = useMemo(() => normalizeConcepts(tree), [tree]);
  const options = useMemo(() => getFilterOptions(concepts), [concepts]);

  const graph = useMemo(() => {
    switch (activeTab) {
      case "focus-gaps":
        return buildFocusGapsGraph(concepts, query, filters);
      case "library":
        return buildLibraryGraph(concepts, query, filters);
      case "curriculum":
        return buildCurriculumGraph(concepts, query, filters);
      case "concept-overview":
        return buildConceptOverviewGraph(concepts, query, filters, selectedNodeId ?? undefined);
    }
  }, [activeTab, concepts, query, filters, selectedNodeId]);

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  const emphasizedNodeIds = useMemo(
    () => gatherConnectedNodeIds(graph, selectedNodeId),
    [graph, selectedNodeId],
  );

  const conceptIndex = useMemo(
    () => new Map(concepts.map((concept) => [concept.id, concept])),
    [concepts],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1860px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Flow Chart Workspace</h1>
              <p className="text-sm text-slate-500">
                High-clarity graph views for academic structure navigation.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedNodeId(null);
                  setFilters({ grade: "", subject: "", chapter: "", parentConcept: "" });
                  setQuery("");
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Reset selection
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to hierarchy
              </button>
            </div>
          </div>

          <FlowChartTabs
            activeTab={activeTab}
            onTabChange={(nextTab) => {
              setActiveTab(nextTab);
              setSelectedNodeId(null);
            }}
          />
        </header>

        <FlowChartToolbar
          query={query}
          onQueryChange={setQuery}
          filters={filters}
          onFiltersChange={setFilters}
          options={options}
        />

        <section className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-sm">
          Nodes: <span className="font-semibold text-slate-800">{graph.nodes.length}</span> · Edges:{" "}
          <span className="font-semibold text-slate-800">{graph.edges.length}</span> · Selected:{" "}
          <span className="font-semibold text-slate-800">{selectedNode ? selectedNode.label : "None"}</span>
        </section>

        {graph.nodes.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            {graph.emptyMessage ?? "No nodes match your current search/filter combination."}
          </section>
        ) : (
          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="min-w-0 flex-1">
              <GraphCanvas
                graph={graph}
                selectedNodeId={selectedNodeId}
                emphasizedNodeIds={emphasizedNodeIds}
                viewport={viewportByTab[activeTab]}
                onViewportChange={(next) =>
                  setViewportByTab((prev) => ({
                    ...prev,
                    [activeTab]: next,
                  }))
                }
                onSelectNode={setSelectedNodeId}
                onResetLayout={() =>
                  setViewportByTab((prev) => ({
                    ...prev,
                    [activeTab]: DEFAULT_VIEWPORT,
                  }))
                }
              />
            </div>

            <DetailsPanel
              selectedNode={selectedNode}
              conceptIndex={conceptIndex}
              onJumpTab={(tab) => setActiveTab(tab)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
