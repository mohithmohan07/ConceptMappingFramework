import { useMemo, useRef, useState } from "react";
import type { GraphModel, GraphNode, Viewport } from "./types";

type Props = {
  graph: GraphModel;
  selectedNodeId: string | null;
  emphasizedNodeIds: Set<string>;
  viewport: Viewport;
  onViewportChange: (next: Viewport) => void;
  onSelectNode: (id: string) => void;
  onResetLayout: () => void;
};

const KIND_CLASS: Record<GraphNode["kind"], string> = {
  chapter: "border-slate-900 bg-slate-900 text-white",
  topic: "border-blue-300 bg-blue-50 text-blue-900",
  parent: "border-violet-300 bg-violet-50 text-violet-900",
  concept: "border-slate-300 bg-white text-slate-800",
};

function smoothStepPath(sx: number, sy: number, tx: number, ty: number) {
  const midX = sx + (tx - sx) * 0.5;
  return `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ty}, ${tx} ${ty}`;
}

function computeBounds(nodes: GraphNode[]) {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 1400, maxY: 950 };
  }

  return {
    minX: Math.min(...nodes.map((n) => n.x)) - 130,
    minY: Math.min(...nodes.map((n) => n.y)) - 120,
    maxX: Math.max(...nodes.map((n) => n.x + (n.width ?? 170))) + 210,
    maxY: Math.max(...nodes.map((n) => n.y + (n.height ?? 44))) + 140,
  };
}

export function GraphCanvas({
  graph,
  selectedNodeId,
  emphasizedNodeIds,
  viewport,
  onViewportChange,
  onSelectNode,
  onResetLayout,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; x: number; y: number } | null>(null);

  const nodeById = useMemo(() => new Map(graph.nodes.map((n) => [n.id, n])), [graph.nodes]);
  const bounds = useMemo(() => computeBounds(graph.nodes), [graph.nodes]);
  const graphWidth = Math.max(1, bounds.maxX - bounds.minX);
  const graphHeight = Math.max(1, bounds.maxY - bounds.minY);

  const fitToView = () => {
    const el = containerRef.current;
    if (!el) return;
    const zoom = Math.max(0.45, Math.min(1.35, Math.min(el.clientWidth / graphWidth, el.clientHeight / graphHeight) * 0.92));
    const x = el.clientWidth / 2 - (bounds.minX + graphWidth / 2) * zoom;
    const y = el.clientHeight / 2 - (bounds.minY + graphHeight / 2) * zoom;
    onViewportChange({ x, y, zoom });
  };

  const minimapScale = 0.12;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1">Drag to pan</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Wheel to zoom</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Stable lane graph</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fitToView}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-50"
          >
            Fit to view
          </button>
          <button
            type="button"
            onClick={onResetLayout}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-50"
          >
            Reset layout
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative h-[72vh] min-h-[560px] overflow-hidden bg-[radial-gradient(circle_at_top,_#f8fafc,_#ffffff)]"
        onWheel={(event) => {
          event.preventDefault();
          const direction = event.deltaY > 0 ? -1 : 1;
          const zoom = Math.max(0.35, Math.min(1.8, viewport.zoom + direction * 0.08));
          onViewportChange({ ...viewport, zoom });
        }}
        onMouseDown={(event) =>
          setDragStart({ mouseX: event.clientX, mouseY: event.clientY, x: viewport.x, y: viewport.y })
        }
        onMouseMove={(event) => {
          if (!dragStart) return;
          onViewportChange({
            ...viewport,
            x: dragStart.x + (event.clientX - dragStart.mouseX),
            y: dragStart.y + (event.clientY - dragStart.mouseY),
          });
        }}
        onMouseUp={() => setDragStart(null)}
        onMouseLeave={() => setDragStart(null)}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`, transformOrigin: "0 0" }}
        >
          {graph.lanes.map((lane) => (
            <div
              key={lane.id}
              className="absolute bottom-0 top-0 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/70"
              style={{ left: lane.x, width: lane.width }}
            >
              <span className="sticky left-2 top-2 inline-block rounded bg-slate-900 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                {lane.label}
              </span>
            </div>
          ))}

          <svg className="pointer-events-none absolute left-0 top-0" width={graphWidth + 600} height={graphHeight + 600}>
            {graph.edges.map((edge) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;

              const sourceX = source.x + (source.width ?? 170);
              const sourceY = source.y + 22;
              const targetX = target.x;
              const targetY = target.y + 22;
              const active = emphasizedNodeIds.has(source.id) && emphasizedNodeIds.has(target.id);

              return (
                <path
                  key={edge.id}
                  d={smoothStepPath(sourceX, sourceY, targetX, targetY)}
                  fill="none"
                  stroke={active ? "#4f46e5" : "#cbd5e1"}
                  strokeOpacity={active ? 0.95 : 0.6}
                  strokeWidth={active ? 2.2 : 1.3}
                />
              );
            })}
          </svg>

          {graph.nodes.map((node) => {
            const selected = node.id === selectedNodeId;
            const dimmed = selectedNodeId !== null && !emphasizedNodeIds.has(node.id);

            return (
              <button
                key={node.id}
                type="button"
                title={node.tooltip}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectNode(node.id);
                }}
                className={`absolute rounded-lg border px-2.5 py-2 text-left text-xs shadow-sm transition ${KIND_CLASS[node.kind]} ${
                  selected ? "ring-2 ring-indigo-400 shadow" : ""
                } ${dimmed ? "opacity-30" : "opacity-100"}`}
                style={{ left: node.x, top: node.y, width: node.width ?? 170, height: node.height ?? 44 }}
              >
                <div className="truncate font-semibold">{node.label}</div>
                {node.meta?.gapScore !== undefined && <div className="text-[10px] opacity-80">Gap: {String(node.meta.gapScore)}</div>}
                {node.meta?.coverage !== undefined && (
                  <div className="text-[10px] opacity-80">Coverage: {String(node.meta.coverage)}</div>
                )}
              </button>
            );
          })}
        </div>

        <div className="absolute bottom-3 right-3 rounded-lg border border-slate-200 bg-white/90 p-2 shadow-sm backdrop-blur">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Minimap</p>
          <svg width={220} height={120} className="rounded bg-slate-50">
            {graph.nodes.map((node) => {
              const x = ((node.x - bounds.minX) / graphWidth) * 210;
              const y = ((node.y - bounds.minY) / graphHeight) * 110;
              return <rect key={node.id} x={x} y={y} width={6} height={4} fill={node.id === selectedNodeId ? "#4f46e5" : "#94a3b8"} />;
            })}
            <rect
              x={(-viewport.x / Math.max(viewport.zoom, 0.001) - bounds.minX) * minimapScale}
              y={(-viewport.y / Math.max(viewport.zoom, 0.001) - bounds.minY) * minimapScale}
              width={(containerRef.current?.clientWidth ?? 900) / Math.max(viewport.zoom, 0.001) * minimapScale}
              height={(containerRef.current?.clientHeight ?? 560) / Math.max(viewport.zoom, 0.001) * minimapScale}
              fill="none"
              stroke="#334155"
              strokeWidth={1}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
