import { useMemo, useRef } from "react";
import type { GraphEdge, GraphNode, Viewport } from "./types";

type Props = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  emphasizedNodeIds: Set<string>;
  viewport: Viewport;
  onViewportChange: (next: Viewport) => void;
  onSelectNode: (id: string) => void;
  onResetLayout: () => void;
};

const KIND_STYLES: Record<GraphNode["kind"], string> = {
  chapter: "border-slate-900 bg-slate-900 text-white",
  topic: "border-blue-300 bg-blue-50 text-blue-900",
  parent: "border-violet-300 bg-violet-50 text-violet-900",
  concept: "border-slate-300 bg-white text-slate-800",
};

const LANE_META = [
  { x: 60, title: "Chapter" },
  { x: 360, title: "Topic" },
  { x: 660, title: "Parent Concept" },
  { x: 960, title: "Concept" },
];

function elbowPath(sx: number, sy: number, tx: number, ty: number) {
  const midX = sx + (tx - sx) * 0.55;
  return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
}

export function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  emphasizedNodeIds,
  viewport,
  onViewportChange,
  onSelectNode,
  onResetLayout,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1400, maxY: 900 };
    return {
      minX: Math.min(...nodes.map((n) => n.x)) - 160,
      minY: Math.min(...nodes.map((n) => n.y)) - 100,
      maxX: Math.max(...nodes.map((n) => n.x)) + 420,
      maxY: Math.max(...nodes.map((n) => n.y)) + 180,
    };
  }, [nodes]);

  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;

  const fitToView = () => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const zoom = Math.max(0.55, Math.min(1.25, Math.min(width / contentWidth, height / contentHeight) * 0.95));
    onViewportChange({ ...viewport, zoom });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1">Organized lane layout</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Scroll to navigate</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={fitToView} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-50">
            Fit to view
          </button>
          <button type="button" onClick={onResetLayout} className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-50">
            Reset layout
          </button>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-slate-50/70 px-3 py-2">
        <input
          type="range"
          min={55}
          max={125}
          value={Math.round(viewport.zoom * 100)}
          onChange={(e) => onViewportChange({ ...viewport, zoom: Number(e.target.value) / 100 })}
          className="w-56"
          aria-label="Zoom"
        />
        <span className="ml-2 text-xs text-slate-500">Zoom {Math.round(viewport.zoom * 100)}%</span>
      </div>

      <div ref={containerRef} className="relative h-[72vh] min-h-[560px] overflow-auto bg-slate-50">
        <div
          className="relative"
          style={{ width: contentWidth * viewport.zoom + 140, height: contentHeight * viewport.zoom + 120 }}
        >
          <div
            className="absolute left-10 top-10"
            style={{
              transform: `scale(${viewport.zoom})`,
              transformOrigin: "top left",
              width: contentWidth,
              height: contentHeight,
            }}
          >
            {LANE_META.map((lane) => (
              <div
                key={lane.title}
                className="absolute bottom-0 top-0 rounded-xl border border-dashed border-slate-200/80 bg-white/40"
                style={{ left: lane.x, width: 250 }}
              >
                <p className="sticky top-2 ml-2 mt-2 inline-block rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                  {lane.title}
                </p>
              </div>
            ))}

            <svg className="pointer-events-none absolute left-0 top-0" width={contentWidth + 120} height={contentHeight + 120}>
              {edges.map((edge) => {
                const source = nodeById.get(edge.source);
                const target = nodeById.get(edge.target);
                if (!source || !target) return null;
                const emphasized = emphasizedNodeIds.has(source.id) && emphasizedNodeIds.has(target.id);
                return (
                  <path
                    key={edge.id}
                    d={elbowPath(source.x + 150, source.y + 18, target.x + 4, target.y + 18)}
                    fill="none"
                    stroke={emphasized ? "#4f46e5" : "#cbd5e1"}
                    strokeWidth={emphasized ? 2.2 : 1.3}
                    strokeOpacity={emphasized ? 0.95 : 0.6}
                  />
                );
              })}
            </svg>

            {nodes.map((node) => {
              const selected = node.id === selectedNodeId;
              const dimmed = selectedNodeId !== null && !emphasizedNodeIds.has(node.id);
              return (
                <button
                  key={node.id}
                  type="button"
                  title={node.tooltip}
                  onClick={() => onSelectNode(node.id)}
                  className={`absolute w-[165px] rounded-lg border px-2.5 py-2 text-left text-xs shadow-sm transition ${KIND_STYLES[node.kind]} ${
                    selected ? "ring-2 ring-indigo-400 shadow" : ""
                  } ${dimmed ? "opacity-30" : "opacity-100"}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <p className="truncate font-semibold leading-4">{node.label}</p>
                  {node.meta?.gapScore !== undefined && <p className="mt-1 text-[10px]">Gap: {String(node.meta.gapScore)}</p>}
                  {node.meta?.coverage !== undefined && <p className="text-[10px]">Coverage: {String(node.meta.coverage)}</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
