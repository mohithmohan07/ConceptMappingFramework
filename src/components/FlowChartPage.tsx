import { useMemo, useState } from "react";
import type { ConceptNode, ParentConceptNode } from "../data/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

function ColumnCard({
  title,
  selected,
  onClick,
}: {
  title: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
        selected
          ? "border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
      }`}
    >
      {title}
    </button>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-64 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const activeParent = useMemo(
    () => tree.find((p) => p.parentConcept === selectedParent) ?? null,
    [tree, selectedParent],
  );

  const grades = activeParent?.grades ?? [];
  const activeGrade = grades.find((g) => g.grade === selectedGrade) ?? null;
  const chapters = activeGrade?.chapters ?? [];
  const activeChapter = chapters.find((ch) => ch.chapter === selectedChapter) ?? null;
  const topics = activeChapter?.topics ?? [];
  const activeTopic = topics.find((t) => t.topic === selectedTopic) ?? null;
  const concepts: ConceptNode[] = activeTopic?.concepts ?? [];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Curriculum Flow Chart
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Select items column-by-column to expand the learning path.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedParent(null);
              setSelectedGrade(null);
              setSelectedChapter(null);
              setSelectedTopic(null);
            }}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          >
            Reset selection
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

      <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
        Path: {selectedParent ?? "—"} → {selectedGrade ? `Grade ${selectedGrade}` : "—"} → {selectedChapter ? `Chapter: ${selectedChapter}` : "—"} → {selectedTopic ?? "—"}
      </p>

      <div className="grid gap-4 lg:grid-cols-5">
        <Column title="Parent Concept">
          {tree.map((p) => (
            <ColumnCard
              key={p.parentConcept}
              title={p.parentConcept}
              selected={selectedParent === p.parentConcept}
              onClick={() => {
                setSelectedParent(p.parentConcept);
                setSelectedGrade(null);
                setSelectedChapter(null);
                setSelectedTopic(null);
              }}
            />
          ))}
        </Column>

        <Column title="Grade">
          {grades.length === 0 && <p className="text-xs text-slate-500">Select parent concept first.</p>}
          {grades.map((g) => (
            <ColumnCard
              key={g.grade}
              title={`Grade ${g.grade}`}
              selected={selectedGrade === g.grade}
              onClick={() => {
                setSelectedGrade(g.grade);
                setSelectedChapter(null);
                setSelectedTopic(null);
              }}
            />
          ))}
        </Column>

        <Column title="Chapter">
          {chapters.length === 0 && <p className="text-xs text-slate-500">Select grade first.</p>}
          {chapters.map((ch) => (
            <ColumnCard
              key={ch.chapter}
              title={`Chapter: ${ch.chapter}`}
              selected={selectedChapter === ch.chapter}
              onClick={() => {
                setSelectedChapter(ch.chapter);
                setSelectedTopic(null);
              }}
            />
          ))}
        </Column>

        <Column title="Topic">
          {topics.length === 0 && <p className="text-xs text-slate-500">Select chapter first.</p>}
          {topics.map((t) => (
            <ColumnCard
              key={t.topic}
              title={t.topic}
              selected={selectedTopic === t.topic}
              onClick={() => setSelectedTopic(t.topic)}
            />
          ))}
        </Column>

        <Column title="Concepts">
          {concepts.length === 0 && <p className="text-xs text-slate-500">Select topic first.</p>}
          {concepts.map((c, idx) => (
            <div
              key={`${c.name}:${idx}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
            >
              {c.name}
            </div>
          ))}
        </Column>
      </div>
    </div>
  );
}
