import { useMemo, useRef, useState } from "react";
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

function edgePath(sx: number, sy: number, tx: number, ty: number) {
  const c1x = sx + (tx - sx) * 0.45;
  const c2x = sx + (tx - sx) * 0.7;
  return `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${ty}, ${tx} ${ty}`;
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
  const [dragStart, setDragStart] = useState<{ mouseX: number; mouseY: number; x: number; y: number } | null>(
    null,
  );

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1200, maxY: 900 };
    return {
      minX: Math.min(...nodes.map((n) => n.x)) - 180,
      minY: Math.min(...nodes.map((n) => n.y)) - 140,
      maxX: Math.max(...nodes.map((n) => n.x)) + 320,
      maxY: Math.max(...nodes.map((n) => n.y)) + 160,
    };
  }, [nodes]);

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.min(2, Math.max(0.35, viewport.zoom + direction * 0.09));
    onViewportChange({ ...viewport, zoom: nextZoom });
  };

  const fitToView = () => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    const zoom = Math.max(0.45, Math.min(1.7, Math.min(width / graphWidth, height / graphHeight) * 0.92));
    const x = width / 2 - (bounds.minX + graphWidth / 2) * zoom;
    const y = height / 2 - (bounds.minY + graphHeight / 2) * zoom;
    onViewportChange({ x, y, zoom });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-2 py-1">Pan</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Zoom</span>
          <span className="rounded-md bg-slate-100 px-2 py-1">Select</span>
        </div>
        <div className="flex gap-2">
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
        onWheel={onWheel}
        onMouseDown={(event) => setDragStart({ mouseX: event.clientX, mouseY: event.clientY, x: viewport.x, y: viewport.y })}
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
        className="relative h-[70vh] min-h-[540px] overflow-hidden bg-[linear-gradient(#f8fafc_1px,transparent_1px),linear-gradient(90deg,#f8fafc_1px,transparent_1px)] [background-size:28px_28px]"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 h-[3200px] w-[4200px]">
            {edges.map((edge) => {
              const source = nodeById.get(edge.source);
              const target = nodeById.get(edge.target);
              if (!source || !target) return null;
              const emphasized = emphasizedNodeIds.has(source.id) && emphasizedNodeIds.has(target.id);
              return (
                <path
                  key={edge.id}
                  d={edgePath(source.x + 120, source.y + 20, target.x + 8, target.y + 20)}
                  fill="none"
                  stroke={emphasized ? "#4f46e5" : "#cbd5e1"}
                  strokeWidth={emphasized ? 2.2 : 1.3}
                  strokeOpacity={emphasized ? 0.95 : 0.65}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectNode(node.id);
                }}
                className={`absolute max-w-[220px] rounded-xl border px-3 py-2 text-left text-xs shadow transition duration-150 ${KIND_STYLES[node.kind]} ${
                  selected ? "ring-2 ring-indigo-400 shadow-lg" : ""
                } ${dimmed ? "opacity-25" : "opacity-100"}`}
                style={{ left: node.x, top: node.y }}
              >
                <p className="truncate font-semibold">{node.label}</p>
                {node.meta?.gapScore !== undefined && (
                  <p className="mt-1 text-[10px] opacity-80">Gap score: {String(node.meta.gapScore)}</p>
                )}
                {node.meta?.coverage !== undefined && (
                  <p className="text-[10px] opacity-80">Coverage: {String(node.meta.coverage)}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
