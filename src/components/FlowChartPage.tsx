import { useMemo, useState } from "react";
import type { ConceptNode, ParentConceptNode } from "../data/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

type ViewTab = "focus-gaps" | "library" | "curriculum" | "concept-overview";

type ChapterAggregate = {
  chapter: string;
  topics: string[];
  concepts: ConceptNode[];
};

type ParentAggregate = {
  parentConcept: string;
  concepts: ConceptNode[];
};

function ColumnCard({
  title,
  selected,
  subtitle,
  onClick,
}: {
  title: string;
  selected: boolean;
  subtitle?: string;
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
      <p>{title}</p>
      {subtitle && <p className="mt-1 text-xs opacity-70">{subtitle}</p>}
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

function dedupeConcepts(concepts: ConceptNode[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    const key = `${concept.name}|${concept.meta.parentConcept}|${concept.meta.chapter}|${concept.meta.topic}|${concept.meta.grade}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<ViewTab>("curriculum");

  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const [selectedFocusChapter, setSelectedFocusChapter] = useState<string | null>(null);
  const [selectedLibraryParent, setSelectedLibraryParent] = useState<string | null>(null);
  const [selectedOverviewConceptKey, setSelectedOverviewConceptKey] = useState<string | null>(null);

  const allConcepts = useMemo(() => {
    const concepts: ConceptNode[] = [];
    for (const parent of tree) {
      for (const grade of parent.grades) {
        for (const chapter of grade.chapters) {
          for (const topic of chapter.topics) {
            concepts.push(...topic.concepts);
          }
        }
      }
    }
    return dedupeConcepts(concepts);
  }, [tree]);

  const chapterAggregates = useMemo<ChapterAggregate[]>(() => {
    const map = new Map<string, { topics: Set<string>; concepts: ConceptNode[] }>();

    for (const concept of allConcepts) {
      const key = concept.meta.chapter;
      if (!map.has(key)) map.set(key, { topics: new Set<string>(), concepts: [] });
      const entry = map.get(key)!;
      entry.topics.add(concept.meta.topic);
      entry.concepts.push(concept);
    }

    return Array.from(map.entries())
      .map(([chapter, value]) => ({
        chapter,
        topics: Array.from(value.topics).sort((a, b) => a.localeCompare(b)),
        concepts: dedupeConcepts(value.concepts),
      }))
      .sort((a, b) => a.chapter.localeCompare(b.chapter));
  }, [allConcepts]);

  const parentAggregates = useMemo<ParentAggregate[]>(() => {
    const map = new Map<string, ConceptNode[]>();
    for (const concept of allConcepts) {
      const key = concept.meta.parentConcept;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(concept);
    }

    return Array.from(map.entries())
      .map(([parentConcept, concepts]) => ({
        parentConcept,
        concepts: dedupeConcepts(concepts),
      }))
      .sort((a, b) => a.parentConcept.localeCompare(b.parentConcept));
  }, [allConcepts]);

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
  const curriculumConcepts: ConceptNode[] = activeTopic?.concepts ?? [];

  const activeFocusChapter =
    chapterAggregates.find((chapter) => chapter.chapter === selectedFocusChapter) ?? null;
  const activeLibraryParent =
    parentAggregates.find((parent) => parent.parentConcept === selectedLibraryParent) ?? null;
  const activeOverviewConcept =
    allConcepts.find(
      (concept) =>
        `${concept.name}|${concept.meta.parentConcept}|${concept.meta.chapter}|${concept.meta.topic}|${concept.meta.grade}` ===
        selectedOverviewConceptKey,
    ) ?? null;

  const resetAllSelections = () => {
    setSelectedParent(null);
    setSelectedGrade(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSelectedFocusChapter(null);
    setSelectedLibraryParent(null);
    setSelectedOverviewConceptKey(null);
  };

  const tabs: Array<{ id: ViewTab; label: string }> = [
    { id: "focus-gaps", label: "Focus Gaps Flow Chart" },
    { id: "library", label: "Library Flow Chart" },
    { id: "curriculum", label: "Curriculum Flow Chart" },
    { id: "concept-overview", label: "Concepts Overview" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
            Flow Chart Views
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Switch tabs to explore chapter, topic, concept, and parent concept relationships.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetAllSelections}
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

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "focus-gaps" && (
        <>
          <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            Path: {selectedFocusChapter ? `Chapter: ${selectedFocusChapter}` : "—"} → Concepts
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Column title="Chapter">
              {chapterAggregates.map((entry) => (
                <ColumnCard
                  key={entry.chapter}
                  title={`Chapter: ${entry.chapter}`}
                  subtitle={`${entry.topics.length} topics · ${entry.concepts.length} concepts`}
                  selected={selectedFocusChapter === entry.chapter}
                  onClick={() => setSelectedFocusChapter(entry.chapter)}
                />
              ))}
            </Column>
            <Column title="Concepts">
              {!activeFocusChapter && <p className="text-xs text-slate-500">Select chapter first.</p>}
              {activeFocusChapter?.concepts.map((concept, idx) => (
                <div
                  key={`${concept.name}:${concept.meta.topic}:${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  <p>{concept.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{concept.meta.topic}</p>
                </div>
              ))}
            </Column>
          </div>
        </>
      )}

      {activeTab === "library" && (
        <>
          <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            Path: {selectedLibraryParent ?? "—"} → Concepts
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <Column title="Parent Concept">
              {parentAggregates.map((entry) => (
                <ColumnCard
                  key={entry.parentConcept}
                  title={entry.parentConcept}
                  subtitle={`${entry.concepts.length} concepts`}
                  selected={selectedLibraryParent === entry.parentConcept}
                  onClick={() => setSelectedLibraryParent(entry.parentConcept)}
                />
              ))}
            </Column>
            <Column title="Concepts">
              {!activeLibraryParent && (
                <p className="text-xs text-slate-500">Select parent concept first.</p>
              )}
              {activeLibraryParent?.concepts.map((concept, idx) => (
                <div
                  key={`${concept.name}:${concept.meta.chapter}:${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  <p>{concept.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Grade {concept.meta.grade} · Chapter: {concept.meta.chapter}
                  </p>
                </div>
              ))}
            </Column>
          </div>
        </>
      )}

      {activeTab === "curriculum" && (
        <>
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
              {curriculumConcepts.length === 0 && <p className="text-xs text-slate-500">Select topic first.</p>}
              {curriculumConcepts.map((c, idx) => (
                <div
                  key={`${c.name}:${idx}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                >
                  {c.name}
                </div>
              ))}
            </Column>
          </div>
        </>
      )}

      {activeTab === "concept-overview" && (
        <>
          <p className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-200">
            Bubble cluster of concepts. Select one concept to reveal its topic, chapter, and parent concept.
          </p>
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Concepts Cluster
              </h2>
              <div className="flex flex-wrap gap-2">
                {allConcepts.map((concept, idx) => {
                  const key = `${concept.name}|${concept.meta.parentConcept}|${concept.meta.chapter}|${concept.meta.topic}|${concept.meta.grade}`;
                  const selected = key === selectedOverviewConceptKey;
                  const bubbleSize = concept.name.length > 20 ? "px-3 py-2" : "px-4 py-3";
                  return (
                    <button
                      key={`${key}:${idx}`}
                      type="button"
                      onClick={() => setSelectedOverviewConceptKey(key)}
                      className={`rounded-full border text-sm transition ${bubbleSize} ${
                        selected
                          ? "border-indigo-300 bg-indigo-50 text-indigo-800 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                      }`}
                    >
                      {concept.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Selected Concept Map
              </h2>
              {!activeOverviewConcept && (
                <p className="text-sm text-slate-500 dark:text-slate-300">Select a concept bubble to inspect its full curriculum lineage.</p>
              )}
              {activeOverviewConcept && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                  <p>
                    <span className="font-semibold">Concept:</span> {activeOverviewConcept.name}
                  </p>
                  <p>
                    <span className="font-semibold">Topic:</span> {activeOverviewConcept.meta.topic}
                  </p>
                  <p>
                    <span className="font-semibold">Chapter:</span> {activeOverviewConcept.meta.chapter}
                  </p>
                  <p>
                    <span className="font-semibold">Parent Concept:</span> {activeOverviewConcept.meta.parentConcept}
                  </p>
                  <p>
                    <span className="font-semibold">Grade:</span> {activeOverviewConcept.meta.grade}
                  </p>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
