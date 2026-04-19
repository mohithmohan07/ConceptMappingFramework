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

function nodeStyle(kind: GraphNode["kind"], active: boolean): string {
  const tone = {
    parent: "border-indigo-300 bg-indigo-50 text-indigo-900",
    grade: "border-sky-300 bg-sky-50 text-sky-900",
    chapter: "border-emerald-300 bg-emerald-50 text-emerald-900",
    topic: "border-violet-300 bg-violet-50 text-violet-900",
    concept: "border-amber-300 bg-amber-50 text-amber-900",
  }[kind];

  return `${tone} ${active ? "ring-2 ring-indigo-300" : ""}`;
}

function bezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const curveOffset = Math.max(40, (x2 - x1) * 0.5);
  return `M ${x1} ${y1} C ${x1 + curveOffset} ${y1}, ${x2 - curveOffset} ${y2}, ${x2} ${y2}`;
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [selectedParentName, setSelectedParentName] = useState<string | null>(
    tree[0]?.parentConcept ?? null,
  );
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const selectedParent =
    tree.find((parent) => parent.parentConcept === selectedParentName) ?? null;

  const layout = useMemo(() => {
    if (!selectedParent) {
      return { nodes: [] as GraphNode[], edges: [] as GraphEdge[], width: 1200, height: 700 };
    }

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const levelX = [80, 340, 600, 860, 1120] as const;
    const rowHeight = 86;

    const activeGrades = selectedGrade
      ? selectedParent.grades.filter((g) => g.grade === selectedGrade)
      : selectedParent.grades;

    const allRows = Math.max(
      8,
      activeGrades.reduce((sum, grade) => {
        const chapterCount = selectedChapter
          ? grade.chapters.filter((c) => c.chapter === selectedChapter).length
          : grade.chapters.length;
        return sum + Math.max(1, chapterCount);
      }, 0) + 2,
    );

    const height = allRows * rowHeight;

    const parentId = `parent:${selectedParent.parentConcept}`;
    nodes.push({
      id: parentId,
      label: selectedParent.parentConcept,
      level: 0,
      x: levelX[0],
      y: height / 2,
      kind: "parent",
    });

    let rowCursor = 1;

    for (const grade of activeGrades) {
      const gradeId = `${parentId}/grade:${grade.grade}`;
      const gradeY = rowCursor * rowHeight;

      nodes.push({
        id: gradeId,
        label: `Grade ${grade.grade}`,
        level: 1,
        x: levelX[1],
        y: gradeY,
        kind: "grade",
      });

      edges.push({ id: `${parentId}->${gradeId}`, from: parentId, to: gradeId });

      const activeChapters = selectedChapter
        ? grade.chapters.filter((ch) => ch.chapter === selectedChapter)
        : grade.chapters;

      for (const chapter of activeChapters) {
        const chapterId = `${gradeId}/chapter:${chapter.chapter}`;
        const chapterY = rowCursor * rowHeight;

        nodes.push({
          id: chapterId,
          label: `Chapter: ${chapter.chapter}`,
          level: 2,
          x: levelX[2],
          y: chapterY,
          kind: "chapter",
        });

        edges.push({ id: `${gradeId}->${chapterId}`, from: gradeId, to: chapterId });

        const activeTopics = selectedTopic
          ? chapter.topics.filter((topic) => topic.topic === selectedTopic)
          : chapter.topics;

        for (const topic of activeTopics) {
          const topicId = `${chapterId}/topic:${topic.topic}`;
          const topicY = rowCursor * rowHeight;

          nodes.push({
            id: topicId,
            label: topic.topic,
            level: 3,
            x: levelX[3],
            y: topicY,
            kind: "topic",
          });

          edges.push({ id: `${chapterId}->${topicId}`, from: chapterId, to: topicId });

          const maxConcepts = selectedTopic ? topic.concepts.length : Math.min(4, topic.concepts.length);
          const conceptsToDraw = topic.concepts.slice(0, maxConcepts);

          conceptsToDraw.forEach((concept, idx) => {
            const conceptId = `${topicId}/concept:${idx}`;
            const conceptY = topicY + idx * 24;

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

          rowCursor += Math.max(1, maxConcepts > 1 ? maxConcepts : 1);
        }
      }
    }

    return {
      nodes,
      edges,
      width: 1360,
      height: Math.max(700, height),
    };
  }, [selectedParent, selectedGrade, selectedChapter, selectedTopic]);

  const nodeById = useMemo(
    () => Object.fromEntries(layout.nodes.map((node) => [node.id, node])),
    [layout.nodes],
  );

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Curriculum Relationship Map
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kumu-style network view: zoom through connected grades, chapters, topics, and concepts.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
        >
          Back to hierarchy
        </button>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Parent Concept
          <select
            value={selectedParentName ?? ""}
            onChange={(e) => {
              setSelectedParentName(e.target.value || null);
              setSelectedGrade(null);
              setSelectedChapter(null);
              setSelectedTopic(null);
            }}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {tree.map((parent) => (
              <option key={parent.parentConcept} value={parent.parentConcept}>
                {parent.parentConcept}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Grade Filter
          <input
            value={selectedGrade ?? ""}
            onChange={(e) => {
              const next = e.target.value.trim();
              setSelectedGrade(next.length > 0 ? next : null);
              setSelectedChapter(null);
              setSelectedTopic(null);
            }}
            placeholder="e.g. 07"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Chapter Filter
          <input
            value={selectedChapter ?? ""}
            onChange={(e) => {
              const next = e.target.value.trim();
              setSelectedChapter(next.length > 0 ? next : null);
              setSelectedTopic(null);
            }}
            placeholder="Exact chapter name"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Topic Filter
          <input
            value={selectedTopic ?? ""}
            onChange={(e) => {
              const next = e.target.value.trim();
              setSelectedTopic(next.length > 0 ? next : null);
            }}
            placeholder="Exact topic name"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>
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

            {layout.nodes.map((node) => (
              <div
                key={node.id}
                className={`absolute w-44 rounded-xl border px-3 py-2 text-xs shadow-sm ${nodeStyle(node.kind, false)}`}
                style={{ left: node.x, top: node.y }}
              >
                <p className="truncate font-semibold">{node.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">{node.kind}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
