import { useMemo, useState } from "react";
import type { ParentConceptNode } from "../data/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

type GraphNode = {
  id: string;
  label: string;
  level: 0 | 1 | 2 | 3 | 4;
  x: number;
  y: number;
  kind: "parent" | "grade" | "chapter" | "topic" | "concept";
};

type GraphEdge = {
  id: string;
  from: string;
  to: string;
};

const EXPORT_COLORS: Record<GraphNode["kind"], { fill: string; stroke: string; text: string }> = {
  parent: { fill: "#eef2ff", stroke: "#a5b4fc", text: "#312e81" },
  grade: { fill: "#f0f9ff", stroke: "#7dd3fc", text: "#0c4a6e" },
  chapter: { fill: "#ecfdf5", stroke: "#86efac", text: "#14532d" },
  topic: { fill: "#f5f3ff", stroke: "#c4b5fd", text: "#4c1d95" },
  concept: { fill: "#fffbeb", stroke: "#fcd34d", text: "#78350f" },
};

function nodeStyle(kind: GraphNode["kind"], active: boolean): string {
  const tone = {
    parent: "border-indigo-300 bg-indigo-50 text-indigo-900",
    grade: "border-sky-300 bg-sky-50 text-sky-900",
    chapter: "border-emerald-300 bg-emerald-50 text-emerald-900",
    topic: "border-violet-300 bg-violet-50 text-violet-900",
    concept: "border-amber-300 bg-amber-50 text-amber-900",
  }[kind];

  return `${tone} transition ${active ? "ring-2 ring-indigo-300" : "hover:ring-1 hover:ring-indigo-200"}`;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const curveOffset = Math.max(40, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 - curveOffset} ${y2}, ${x2} ${y2}`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [selectedParentName, setSelectedParentName] = useState<string | null>(
    tree[0]?.parentConcept ?? null,
  );
  const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const selectedParent = tree.find((parent) => parent.parentConcept === selectedParentName) ?? null;
  const selectedGradeNode =
    selectedParent?.grades.find((grade) => grade.grade === expandedGrade) ?? null;
  const selectedChapterNode =
    selectedGradeNode?.chapters.find((chapter) => chapter.chapter === expandedChapter) ?? null;
  const selectedTopicNode =
    selectedChapterNode?.topics.find((topic) => topic.topic === expandedTopic) ?? null;

  const layout = useMemo(() => {
    if (!tree.length) {
      return { nodes: [] as GraphNode[], edges: [] as GraphEdge[], width: 1200, height: 700 };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const levelX = [40, 300, 560, 820, 1080] as const;
    const rowHeight = 58;
    const startY = 36;

    tree.forEach((parent, index) => {
      const parentId = `parent:${parent.parentConcept}`;
      const parentY = startY + index * rowHeight;
      nodes.push({
        id: parentId,
        label: parent.parentConcept,
        level: 0,
        x: levelX[0],
        y: parentY,
        kind: "parent",
      });
    });

    if (selectedParent) {
      const parentId = `parent:${selectedParent.parentConcept}`;

      selectedParent.grades.forEach((grade, index) => {
        const gradeId = `${parentId}/grade:${grade.grade}`;
        const gradeY = startY + index * rowHeight;
        nodes.push({
          id: gradeId,
          label: `Grade ${grade.grade}`,
          level: 1,
          x: levelX[1],
          y: gradeY,
          kind: "grade",
        });
        edges.push({ id: `${parentId}->${gradeId}`, from: parentId, to: gradeId });
      });
    }

    if (selectedParent && selectedGradeNode) {
      const parentId = `parent:${selectedParent.parentConcept}`;
      const gradeId = `${parentId}/grade:${selectedGradeNode.grade}`;
      selectedGradeNode.chapters.forEach((chapter, index) => {
        const chapterId = `${gradeId}/chapter:${chapter.chapter}`;
        const chapterY = startY + index * rowHeight;
        nodes.push({
          id: chapterId,
          label: `Chapter: ${chapter.chapter}`,
          level: 2,
          x: levelX[2],
          y: chapterY,
          kind: "chapter",
        });
        edges.push({ id: `${gradeId}->${chapterId}`, from: gradeId, to: chapterId });
      });
    }

    if (selectedParent && selectedGradeNode && selectedChapterNode) {
      const parentId = `parent:${selectedParent.parentConcept}`;
      const gradeId = `${parentId}/grade:${selectedGradeNode.grade}`;
      const chapterId = `${gradeId}/chapter:${selectedChapterNode.chapter}`;
      selectedChapterNode.topics.forEach((topic, index) => {
        const topicId = `${chapterId}/topic:${topic.topic}`;
        const topicY = startY + index * rowHeight;
        nodes.push({
          id: topicId,
          label: topic.topic,
          level: 3,
          x: levelX[3],
          y: topicY,
          kind: "topic",
        });
        edges.push({ id: `${chapterId}->${topicId}`, from: chapterId, to: topicId });
      });
    }

    if (selectedParent && selectedGradeNode && selectedChapterNode && selectedTopicNode) {
      const parentId = `parent:${selectedParent.parentConcept}`;
      const gradeId = `${parentId}/grade:${selectedGradeNode.grade}`;
      const chapterId = `${gradeId}/chapter:${selectedChapterNode.chapter}`;
      const topicId = `${chapterId}/topic:${selectedTopicNode.topic}`;
      selectedTopicNode.concepts.forEach((concept, index) => {
        const conceptId = `${topicId}/concept:${index}`;
        const conceptY = startY + index * rowHeight;
        nodes.push({
          id: conceptId,
          label: concept.name,
          level: 4,
          x: levelX[4],
          y: conceptY,
          kind: "concept",
        });
        edges.push({ id: `${topicId}->${conceptId}`, from: topicId, to: conceptId });
      });
    }

    return {
      nodes,
      edges,
      width: 1320,
      height: Math.max(
        520,
        startY +
          Math.max(
            tree.length,
            selectedParent?.grades.length ?? 0,
            selectedGradeNode?.chapters.length ?? 0,
            selectedChapterNode?.topics.length ?? 0,
            selectedTopicNode?.concepts.length ?? 0,
          ) *
            rowHeight +
          48,
      ),
    };
  }, [tree, selectedParent, selectedGradeNode, selectedChapterNode, selectedTopicNode]);

  const nodeById = useMemo(
    () => Object.fromEntries(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes],
  );

  const downloadSnapshot = () => {
    const svgEdges = layout.edges
      .map((edge) => {
        const from = nodeById[edge.from];
        const to = nodeById[edge.to];
        if (!from || !to) return "";
        const x1 = from.x + 180;
        const y1 = from.y + 20;
        const x2 = to.x;
        const y2 = to.y + 20;
        return `<path d="${bezierPath(x1, y1, x2, y2)}" fill="none" stroke="rgba(99,102,241,0.35)" stroke-width="1.7" />`;
      })
      .join("");

    const svgNodes = layout.nodes
      .map((node) => {
        const color = EXPORT_COLORS[node.kind];
        return `<g>
  <rect x="${node.x}" y="${node.y}" width="208" height="42" rx="12" ry="12" fill="${color.fill}" stroke="${color.stroke}" />
  <text x="${node.x + 12}" y="${node.y + 18}" fill="${color.text}" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600">${escapeXml(node.label)}</text>
  <text x="${node.x + 12}" y="${node.y + 34}" fill="${color.text}" font-family="Inter, Arial, sans-serif" font-size="10" opacity="0.7">${node.kind.toUpperCase()}</text>
</g>`;
      })
      .join("");

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}">
<rect width="100%" height="100%" fill="#f8fafc" />
${svgEdges}
${svgNodes}
</svg>`;

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "curriculum-flow-map.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Curriculum Relationship Map
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Compact, collapsed map: open one branch at a time to explore connected grades, chapters,
            topics, and concepts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={downloadSnapshot}
            className="rounded-full border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-800 hover:bg-indigo-100 dark:border-indigo-500/60 dark:bg-indigo-950/50 dark:text-indigo-200"
          >
            Download screenshot (SVG)
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            Back to hierarchy
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
        Click a node to expand that line. Only one line stays open at each level to keep the chart
        compact and readable.
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-soft dark:border-slate-700 dark:bg-slate-900">
        <div className="relative h-[72vh] overflow-auto rounded-xl bg-slate-50 dark:bg-slate-950/50">
          <div className="relative" style={{ width: layout.width, height: layout.height }}>
            <svg className="absolute inset-0" width={layout.width} height={layout.height}>
              {layout.edges.map((edge) => {
                const from = nodeById[edge.from];
                const to = nodeById[edge.to];
                if (!from || !to) return null;

                const x1 = from.x + 180;
                const y1 = from.y + 20;
                const x2 = to.x;
                const y2 = to.y + 20;

                return (
                  <path
                    key={edge.id}
                    d={bezierPath(x1, y1, x2, y2)}
                    fill="none"
                    stroke="rgba(99,102,241,0.35)"
                    strokeWidth={1.7}
                  />
                );
              })}
            </svg>

            {layout.nodes.map((node) => {
              const isActive =
                (node.kind === "parent" && selectedParentName === node.label) ||
                (node.kind === "grade" && node.label === `Grade ${expandedGrade}`) ||
                (node.kind === "chapter" && node.label === `Chapter: ${expandedChapter}`) ||
                (node.kind === "topic" && node.label === expandedTopic);

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => {
                    if (node.kind === "parent") {
                      const parentLabel = node.label;
                      setSelectedParentName((current) =>
                        current === parentLabel ? null : parentLabel,
                      );
                      setExpandedGrade(null);
                      setExpandedChapter(null);
                      setExpandedTopic(null);
                      return;
                    }
                    if (node.kind === "grade") {
                      const gradeValue = node.label.replace("Grade ", "");
                      setExpandedGrade((current) => (current === gradeValue ? null : gradeValue));
                      setExpandedChapter(null);
                      setExpandedTopic(null);
                      return;
                    }
                    if (node.kind === "chapter") {
                      const chapterValue = node.label.replace("Chapter: ", "");
                      setExpandedChapter((current) =>
                        current === chapterValue ? null : chapterValue,
                      );
                      setExpandedTopic(null);
                      return;
                    }
                    if (node.kind === "topic") {
                      setExpandedTopic((current) => (current === node.label ? null : node.label));
                    }
                  }}
                  className={`absolute w-52 rounded-xl border px-3 py-2 text-left text-xs shadow-sm ${nodeStyle(node.kind, isActive)}`}
                  style={{ left: node.x, top: node.y }}
                >
                  <p className="truncate font-semibold">{node.label}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">{node.kind}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
