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

  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 800 };
    return {
      minX: Math.min(...nodes.map((n) => n.x)) - 140,
      minY: Math.min(...nodes.map((n) => n.y)) - 100,
      maxX: Math.max(...nodes.map((n) => n.x)) + 250,
      maxY: Math.max(...nodes.map((n) => n.y)) + 120,
    };
  }, [nodes]);

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -1 : 1;
    const nextZoom = Math.min(1.8, Math.max(0.4, viewport.zoom + direction * 0.08));
    onViewportChange({ ...viewport, zoom: nextZoom });
  };

  const fitToView = () => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const graphWidth = bounds.maxX - bounds.minX;
    const graphHeight = bounds.maxY - bounds.minY;
    const zoom = Math.max(0.45, Math.min(1.6, Math.min(width / graphWidth, height / graphHeight) * 0.9));
    const x = width / 2 - (bounds.minX + graphWidth / 2) * zoom;
    const y = height / 2 - (bounds.minY + graphHeight / 2) * zoom;
    onViewportChange({ x, y, zoom });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>Pan: drag canvas</span>
          <span>·</span>
          <span>Zoom: mouse wheel</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fitToView}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900"
          >
            Fit to view
          </button>
          <button
            type="button"
            onClick={onResetLayout}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900"
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
        className="relative h-[68vh] min-h-[520px] overflow-hidden"
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
            transformOrigin: "0 0",
          }}
        >
          <svg className="pointer-events-none absolute left-0 top-0 h-[2200px] w-[2600px]">
            {edges.map((edge) => {
              const source = nodes.find((n) => n.id === edge.source);
              const target = nodes.find((n) => n.id === edge.target);
              if (!source || !target) return null;
              const emphasized = emphasizedNodeIds.has(source.id) && emphasizedNodeIds.has(target.id);
              return (
                <line
                  key={edge.id}
                  x1={source.x + 90}
                  y1={source.y + 20}
                  x2={target.x + 10}
                  y2={target.y + 20}
                  stroke={emphasized ? "#4f46e5" : "#cbd5e1"}
                  strokeWidth={emphasized ? 2.5 : 1.4}
                  strokeOpacity={emphasized ? 0.95 : 0.7}
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
                className={`absolute max-w-[220px] rounded-xl border px-3 py-2 text-left text-xs shadow-sm transition ${KIND_STYLES[node.kind]} ${
                  selected ? "ring-2 ring-indigo-400" : ""
                } ${dimmed ? "opacity-30" : "opacity-100"}`}
                style={{ left: node.x, top: node.y }}
              >
                <p className="truncate font-semibold">{node.label}</p>
                {node.meta?.gapScore !== undefined && (
                  <p className="mt-0.5 text-[10px] opacity-80">Gap: {String(node.meta.gapScore)}</p>
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
