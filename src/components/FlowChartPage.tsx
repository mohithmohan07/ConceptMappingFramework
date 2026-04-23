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

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-200">
      {children}
    </span>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

function SelectCard({
  title,
  subtitle,
  selected,
  onClick,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border p-3 text-left transition duration-200 ${
        selected
          ? "border-indigo-300 bg-gradient-to-r from-indigo-50 to-violet-50 shadow-sm dark:border-indigo-500 dark:from-indigo-950/50 dark:to-violet-950/40"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
      }`}
    >
      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </button>
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

function conceptKey(concept: ConceptNode) {
  return `${concept.name}|${concept.meta.parentConcept}|${concept.meta.chapter}|${concept.meta.topic}|${concept.meta.grade}`;
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
    allConcepts.find((concept) => conceptKey(concept) === selectedOverviewConceptKey) ?? null;

  const resetAllSelections = () => {
    setSelectedParent(null);
    setSelectedGrade(null);
    setSelectedChapter(null);
    setSelectedTopic(null);
    setSelectedFocusChapter(null);
    setSelectedLibraryParent(null);
    setSelectedOverviewConceptKey(null);
  };

  const tabs: Array<{ id: ViewTab; label: string; description: string }> = [
    {
      id: "focus-gaps",
      label: "Focus Gaps",
      description: "Chapter → concept gap-scanning lens",
    },
    {
      id: "library",
      label: "Library",
      description: "Parent concept → concept catalog",
    },
    {
      id: "curriculum",
      label: "Curriculum",
      description: "Parent → grade → chapter → topic flow",
    },
    {
      id: "concept-overview",
      label: "Concepts Overview",
      description: "Interactive concept bubble constellation",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0_0%,_#f8fafc_45%,_#f8fafc_100%)] px-4 py-6 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-soft backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/80">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">
                Flow Chart Studio
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                A dynamic workspace to inspect curriculum relationships from multiple angles.
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

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  activeTab === tab.id
                    ? "border-indigo-300 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 dark:border-indigo-500 dark:from-indigo-950/60 dark:via-violet-950/50 dark:to-fuchsia-950/40"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                }`}
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{tab.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{tab.description}</p>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "focus-gaps" && (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Chapters"
                subtitle="Pick a chapter to visualize concept spread and possible focus gaps"
              />
              <div className="space-y-2">
                {chapterAggregates.map((entry) => (
                  <SelectCard
                    key={entry.chapter}
                    title={`Chapter: ${entry.chapter}`}
                    subtitle={`${entry.topics.length} topics · ${entry.concepts.length} concepts`}
                    selected={selectedFocusChapter === entry.chapter}
                    onClick={() => setSelectedFocusChapter(entry.chapter)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Focus Gaps Flow"
                subtitle="Each bubble is a concept tied to the selected chapter"
              />
              {!activeFocusChapter && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  Select a chapter to reveal an interactive concept cloud.
                </p>
              )}

              {activeFocusChapter && (
                <>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Pill>{`Chapter: ${activeFocusChapter.chapter}`}</Pill>
                    <Pill>{`${activeFocusChapter.topics.length} Topics`}</Pill>
                    <Pill>{`${activeFocusChapter.concepts.length} Concepts`}</Pill>
                  </div>
                  <div className="flex min-h-52 flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/40">
                    {activeFocusChapter.concepts.map((concept, idx) => (
                      <div
                        key={`${conceptKey(concept)}:${idx}`}
                        className="rounded-full border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-indigo-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {concept.name}
                        <span className="ml-2 text-[11px] text-slate-400">{concept.meta.topic}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        )}

        {activeTab === "library" && (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Parent Concept Library"
                subtitle="Browse parent buckets and inspect all linked concepts"
              />
              <div className="space-y-2">
                {parentAggregates.map((entry) => (
                  <SelectCard
                    key={entry.parentConcept}
                    title={entry.parentConcept}
                    subtitle={`${entry.concepts.length} concepts`}
                    selected={selectedLibraryParent === entry.parentConcept}
                    onClick={() => setSelectedLibraryParent(entry.parentConcept)}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Library Flow"
                subtitle="Concept cards carry grade and chapter context for quick scanning"
              />
              {!activeLibraryParent && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  Select a parent concept to load the concept library cards.
                </p>
              )}

              {activeLibraryParent && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {activeLibraryParent.concepts.map((concept, idx) => (
                    <div
                      key={`${conceptKey(concept)}:${idx}`}
                      className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800"
                    >
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{concept.name}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Pill>{`Grade ${concept.meta.grade}`}</Pill>
                        <Pill>{`Chapter ${concept.meta.chapter}`}</Pill>
                        <Pill>{concept.meta.topic}</Pill>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "curriculum" && (
          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Curriculum Flow Chart"
                subtitle="Move left to right through the instructional hierarchy"
              />
              <div className="grid gap-3 lg:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Parent Concept</p>
                  <div className="space-y-2">
                    {tree.map((p) => (
                      <SelectCard
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
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Grade</p>
                  <div className="space-y-2">
                    {grades.length === 0 && <p className="text-xs text-slate-500">Select parent concept first.</p>}
                    {grades.map((g) => (
                      <SelectCard
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
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Chapter</p>
                  <div className="space-y-2">
                    {chapters.length === 0 && <p className="text-xs text-slate-500">Select grade first.</p>}
                    {chapters.map((ch) => (
                      <SelectCard
                        key={ch.chapter}
                        title={`Chapter ${ch.chapter}`}
                        selected={selectedChapter === ch.chapter}
                        onClick={() => {
                          setSelectedChapter(ch.chapter);
                          setSelectedTopic(null);
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Topic</p>
                  <div className="space-y-2">
                    {topics.length === 0 && <p className="text-xs text-slate-500">Select chapter first.</p>}
                    {topics.map((t) => (
                      <SelectCard
                        key={t.topic}
                        title={t.topic}
                        selected={selectedTopic === t.topic}
                        onClick={() => setSelectedTopic(t.topic)}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Concepts</p>
                  <div className="space-y-2">
                    {curriculumConcepts.length === 0 && <p className="text-xs text-slate-500">Select topic first.</p>}
                    {curriculumConcepts.map((concept, idx) => (
                      <div
                        key={`${conceptKey(concept)}:${idx}`}
                        className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200"
                      >
                        {concept.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Current Path"
                subtitle="Instant summary of your active curriculum trail"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Pill>{selectedParent ?? "Parent concept"}</Pill>
                <span className="text-slate-400">→</span>
                <Pill>{selectedGrade ? `Grade ${selectedGrade}` : "Grade"}</Pill>
                <span className="text-slate-400">→</span>
                <Pill>{selectedChapter ? `Chapter ${selectedChapter}` : "Chapter"}</Pill>
                <span className="text-slate-400">→</span>
                <Pill>{selectedTopic ?? "Topic"}</Pill>
              </div>
            </section>
          </div>
        )}

        {activeTab === "concept-overview" && (
          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Concept Constellation"
                subtitle="Click a bubble to follow concept → topic → chapter → parent concept"
              />

              <div className="relative mx-auto mt-2 h-[520px] w-full max-w-[760px] overflow-hidden rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_center,_#eef2ff_0%,_#f8fafc_55%,_#ffffff_100%)] dark:border-slate-700 dark:bg-[radial-gradient(circle_at_center,_#312e81_0%,_#111827_60%,_#0f172a_100%)]">
                <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-300 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow dark:border-indigo-600 dark:bg-slate-900 dark:text-indigo-200">
                  Concepts
                </div>
                {allConcepts.map((concept, idx) => {
                  const key = conceptKey(concept);
                  const selected = key === selectedOverviewConceptKey;
                  const angle = (idx / Math.max(allConcepts.length, 1)) * Math.PI * 2;
                  const ring = idx % 3;
                  const radius = ring === 0 ? 140 : ring === 1 ? 190 : 230;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedOverviewConceptKey(key)}
                      style={{
                        left: `calc(50% + ${x}px)`,
                        top: `calc(50% + ${y}px)`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className={`absolute rounded-full border px-3 py-1.5 text-xs shadow-sm transition hover:scale-105 ${
                        selected
                          ? "z-20 border-indigo-300 bg-indigo-100 text-indigo-800 dark:border-indigo-500 dark:bg-indigo-950/60 dark:text-indigo-200"
                          : "border-slate-200 bg-white/95 text-slate-700 dark:border-slate-600 dark:bg-slate-900/85 dark:text-slate-200"
                      }`}
                    >
                      {concept.name}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft dark:border-slate-700 dark:bg-slate-900">
              <SectionTitle
                title="Lineage Inspector"
                subtitle="Selected concept's curriculum mapping"
              />
              {!activeOverviewConcept && (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                  Choose any concept bubble to inspect details.
                </p>
              )}

              {activeOverviewConcept && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Concept</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeOverviewConcept.name}</p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <span className="text-xs text-slate-500">Topic</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activeOverviewConcept.meta.topic}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <span className="text-xs text-slate-500">Chapter</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activeOverviewConcept.meta.chapter}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <span className="text-xs text-slate-500">Parent Concept</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activeOverviewConcept.meta.parentConcept}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                      <span className="text-xs text-slate-500">Grade</span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {activeOverviewConcept.meta.grade}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
