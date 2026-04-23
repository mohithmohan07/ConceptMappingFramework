import type { FlowTab, GraphNode, NormalizedConcept } from "./types";

type Props = {
  selectedNode: GraphNode | null;
  conceptIndex: Map<string, NormalizedConcept>;
  onJumpTab: (tab: FlowTab) => void;
};

function ValueRow({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-right text-slate-700">{value || "—"}</span>
    </div>
  );
}

export function DetailsPanel({ selectedNode, conceptIndex, onJumpTab }: Props) {
  const selectedConcept =
    selectedNode && selectedNode.id.startsWith("concept:")
      ? conceptIndex.get(selectedNode.id.replace("concept:", ""))
      : null;

  const chapter = selectedConcept?.chapter ?? (selectedNode?.meta?.chapter as string | undefined);
  const topic = selectedConcept?.topic ?? (selectedNode?.meta?.topic as string | undefined);
  const parent = selectedConcept?.parentConcept ?? (selectedNode?.meta?.parentConcept as string | undefined);

  return (
    <aside className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:w-[360px]">
      <h3 className="text-sm font-semibold text-slate-800">Details Panel</h3>
      {!selectedNode && <p className="mt-3 text-sm text-slate-500">Select a node to inspect metadata and lineage.</p>}

      {selectedNode && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">{selectedNode.kind}</p>
            <p className="text-sm font-semibold text-slate-900">{selectedNode.label}</p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
            Breadcrumb: {chapter ?? "Chapter"} &gt; {topic ?? "Topic"} &gt; {parent ?? "Parent Concept"} &gt; {selectedNode.label}
          </div>

          <div className="space-y-2">
            <ValueRow label="Chapter" value={chapter} />
            <ValueRow label="Topic" value={topic} />
            <ValueRow label="Parent Concept" value={parent} />
            <ValueRow label="Grade" value={selectedConcept?.grade ?? (selectedNode.meta?.grade as string | undefined)} />
            <ValueRow
              label="Description"
              value={selectedConcept?.description || (selectedNode.meta?.description as string | undefined)}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Jump to linked view</p>
            <div className="grid gap-2">
              <button type="button" onClick={() => onJumpTab("focus-gaps")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">Open in Focus Gaps Flow Chart</button>
              <button type="button" onClick={() => onJumpTab("library")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">Open in Library Flow Chart</button>
              <button type="button" onClick={() => onJumpTab("curriculum")} className="rounded-lg border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50">Open in Curriculum Flow Chart</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
