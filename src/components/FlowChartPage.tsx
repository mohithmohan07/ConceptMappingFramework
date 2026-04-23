import { useMemo, useState } from "react";
import type { ParentConceptNode } from "../data/types";
import { parseConceptDescription } from "../lib/parseDescription";
import { getFilterOptions, normalizeConcepts } from "./flowchart/adapters";
import type { FlowFilters, FlowTab, NormalizedConcept } from "./flowchart/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

function tabClass(active: boolean) {
  return active
    ? "border-indigo-300 bg-indigo-50 text-indigo-900"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

function TabButton({
  active,
  label,
  subtitle,
  onClick,
}: {
  active: boolean;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-3 text-left transition ${tabClass(active)}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs opacity-80">{subtitle}</p>
    </button>
  );
}

function BlockCard({
  title,
  selected,
  hint,
  onClick,
}: {
  title: string;
  selected?: boolean;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </button>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      <select
        className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ColumnPanel({
  title,
  count,
  empty,
  children,
}: {
  title: string;
  count?: number;
  empty?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {typeof count === "number" && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{count}</span>
        )}
      </div>
      <div className="space-y-2">
        {empty && <p className="text-xs text-slate-500">{empty}</p>}
        {children}
      </div>
    </div>
  );
}

function applyFilters(concepts: NormalizedConcept[], query: string, filters: FlowFilters) {
  const normalizedQuery = query.trim().toLowerCase();
  return concepts.filter((concept) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      [concept.name, concept.chapter, concept.topic, concept.parentConcept, concept.description]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return (
      matchesQuery &&
      (!filters.grade || concept.grade === filters.grade) &&
      (!filters.subject || concept.subject === filters.subject) &&
      (!filters.chapter || concept.chapter === filters.chapter) &&
      (!filters.parentConcept || concept.parentConcept === filters.parentConcept)
    );
  });
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [tab, setTab] = useState<FlowTab>("focus-gaps");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FlowFilters>({
    grade: "",
    subject: "",
    chapter: "",
    parentConcept: "",
  });

  const [fgGrade, setFgGrade] = useState<string | null>(null);
  const [fgChapter, setFgChapter] = useState<string | null>(null);
  const [fgTopic, setFgTopic] = useState<string | null>(null);
  const [fgConcept, setFgConcept] = useState<string | null>(null);

  const [libraryParent, setLibraryParent] = useState<string | null>(null);
  const [curGrade, setCurGrade] = useState<string | null>(null);
  const [curChapter, setCurChapter] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const concepts = useMemo(() => normalizeConcepts(tree), [tree]);
  const options = useMemo(() => getFilterOptions(concepts), [concepts]);
  const filtered = useMemo(() => applyFilters(concepts, query, filters), [concepts, query, filters]);

  const grades = useMemo(
    () => Array.from(new Set(filtered.map((concept) => concept.grade))).sort((a, b) => a.localeCompare(b)),
    [filtered],
  );

  const fgChapters = useMemo(
    () =>
      Array.from(new Set(filtered.filter((concept) => concept.grade === fgGrade).map((concept) => concept.chapter))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [filtered, fgGrade],
  );

  const fgTopics = useMemo(
    () =>
      Array.from(
        new Set(
          filtered
            .filter((concept) => concept.grade === fgGrade && concept.chapter === fgChapter)
            .map((concept) => concept.topic),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [filtered, fgGrade, fgChapter],
  );

  const fgConcepts = useMemo(
    () =>
      filtered.filter(
        (concept) => concept.grade === fgGrade && concept.chapter === fgChapter && concept.topic === fgTopic,
      ),
    [filtered, fgGrade, fgChapter, fgTopic],
  );

  const fgParentConcepts = useMemo(() => {
    if (fgConcept) {
      const selected = fgConcepts.find((concept) => concept.id === fgConcept);
      return selected ? [selected.parentConcept] : [];
    }
    return Array.from(new Set(fgConcepts.map((concept) => concept.parentConcept))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [fgConcepts, fgConcept]);

  const libraryParents = useMemo(
    () =>
      Array.from(new Set(filtered.map((concept) => concept.parentConcept))).sort((a, b) => a.localeCompare(b)),
    [filtered],
  );

  const libraryConcepts = useMemo(
    () => filtered.filter((concept) => concept.parentConcept === libraryParent),
    [filtered, libraryParent],
  );

  const curChapters = useMemo(
    () =>
      Array.from(new Set(filtered.filter((concept) => concept.grade === curGrade).map((concept) => concept.chapter))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [filtered, curGrade],
  );

  const curTopics = useMemo(
    () =>
      Array.from(
        new Set(
          filtered
            .filter((concept) => concept.grade === curGrade && concept.chapter === curChapter)
            .map((concept) => concept.topic),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [filtered, curGrade, curChapter],
  );

  const groupedConcepts = useMemo(() => {
    const byGrade = new Map<string, Map<string, NormalizedConcept[]>>();
    filtered.forEach((concept) => {
      if (!byGrade.has(concept.grade)) byGrade.set(concept.grade, new Map());
      const byChapter = byGrade.get(concept.grade)!;
      if (!byChapter.has(concept.chapter)) byChapter.set(concept.chapter, []);
      byChapter.get(concept.chapter)!.push(concept);
    });
    return Array.from(byGrade.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const selectedConcept = filtered.find((concept) => concept.id === selectedConceptId) ?? null;
  const parsed = parseConceptDescription(selectedConcept?.description ?? "");

  const relatedConcepts = useMemo(() => {
    if (!selectedConcept) return [] as NormalizedConcept[];
    return filtered
      .filter(
        (concept) =>
          concept.id !== selectedConcept.id &&
          concept.parentConcept === selectedConcept.parentConcept &&
          concept.chapter === selectedConcept.chapter,
      )
      .slice(0, 8);
  }, [selectedConcept, filtered]);

  const resetSelections = () => {
    setFgGrade(null);
    setFgChapter(null);
    setFgTopic(null);
    setFgConcept(null);
    setLibraryParent(null);
    setCurGrade(null);
    setCurChapter(null);
    setSelectedConceptId(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1760px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Flow Chart Workspace</h1>
              <p className="text-sm text-slate-500">Smarter block navigation with curriculum-first drill-down.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetSelections}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
              >
                Reset selection
              </button>
              <button
                type="button"
                onClick={onBack}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
              >
                Back to hierarchy
              </button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <TabButton
              active={tab === "focus-gaps"}
              onClick={() => setTab("focus-gaps")}
              label="Focus Gaps Flow Chart"
              subtitle="Grade → Chapter → Topic → Concept → Parent"
            />
            <TabButton
              active={tab === "library"}
              onClick={() => setTab("library")}
              label="Library Flow Chart"
              subtitle="Parent Concept → Concepts with grade/chapter"
            />
            <TabButton
              active={tab === "curriculum"}
              onClick={() => setTab("curriculum")}
              label="Curriculum Flow Chart"
              subtitle="Grade → Chapter → Topics"
            />
            <TabButton
              active={tab === "concept-overview"}
              onClick={() => setTab("concept-overview")}
              label="Concepts - Parent Concepts Flow Chart"
              subtitle="Grouped concepts + downward lineage"
            />
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 text-xs text-slate-500">Total visible concepts: {filtered.length}</div>
          <div className="grid gap-2 lg:grid-cols-[1.4fr_repeat(4,minmax(140px,1fr))]">
            <label className="flex flex-col gap-1 text-xs text-slate-600">
              Search
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Search chapter, topic, parent concept, concept"
              />
            </label>
            <SelectField
              label="Grade"
              value={filters.grade}
              options={options.grades}
              onChange={(value) => setFilters({ ...filters, grade: value })}
            />
            <SelectField
              label="Subject"
              value={filters.subject}
              options={options.subjects}
              onChange={(value) => setFilters({ ...filters, subject: value })}
            />
            <SelectField
              label="Chapter"
              value={filters.chapter}
              options={options.chapters}
              onChange={(value) => setFilters({ ...filters, chapter: value })}
            />
            <SelectField
              label="Parent Concept"
              value={filters.parentConcept}
              options={options.parentConcepts}
              onChange={(value) => setFilters({ ...filters, parentConcept: value })}
            />
          </div>
        </section>

        {tab === "focus-gaps" && (
          <section className="grid gap-3 xl:grid-cols-5">
            <ColumnPanel title="Grade" count={grades.length}>
              {grades.map((grade) => (
                <BlockCard
                  key={grade}
                  title={`Grade ${grade}`}
                  selected={fgGrade === grade}
                  onClick={() => {
                    setFgGrade(grade);
                    setFgChapter(null);
                    setFgTopic(null);
                    setFgConcept(null);
                  }}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel title="Chapter" count={fgChapters.length} empty={fgChapters.length === 0 ? "Select grade first." : undefined}>
              {fgChapters.map((chapter) => (
                <BlockCard
                  key={chapter}
                  title={chapter}
                  selected={fgChapter === chapter}
                  onClick={() => {
                    setFgChapter(chapter);
                    setFgTopic(null);
                    setFgConcept(null);
                  }}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel title="Topic" count={fgTopics.length} empty={fgTopics.length === 0 ? "Select chapter first." : undefined}>
              {fgTopics.map((topic) => (
                <BlockCard
                  key={topic}
                  title={topic}
                  selected={fgTopic === topic}
                  onClick={() => {
                    setFgTopic(topic);
                    setFgConcept(null);
                  }}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel
              title="Concepts"
              count={fgConcepts.length}
              empty={fgConcepts.length === 0 ? "Select topic first." : undefined}
            >
              {fgConcepts.map((concept) => (
                <BlockCard
                  key={concept.id}
                  title={concept.name}
                  hint={`Gap ${concept.gapScore ?? "-"} · Coverage ${concept.coverage ?? "-"}`}
                  selected={fgConcept === concept.id}
                  onClick={() => {
                    setFgConcept(concept.id);
                    setSelectedConceptId(concept.id);
                  }}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel
              title="Parent Concept"
              count={fgParentConcepts.length}
              empty={fgParentConcepts.length === 0 ? "Select concept/topic first." : undefined}
            >
              {fgParentConcepts.map((parentConcept) => (
                <BlockCard key={parentConcept} title={parentConcept} />
              ))}
            </ColumnPanel>
          </section>
        )}

        {tab === "library" && (
          <section className="grid gap-3 xl:grid-cols-[330px_1fr]">
            <ColumnPanel title="Parent Concepts" count={libraryParents.length}>
              {libraryParents.map((parentConcept) => (
                <BlockCard
                  key={parentConcept}
                  title={parentConcept}
                  selected={libraryParent === parentConcept}
                  onClick={() => setLibraryParent(parentConcept)}
                />
              ))}
            </ColumnPanel>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Concepts</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{libraryConcepts.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {libraryConcepts.map((concept) => (
                  <BlockCard
                    key={concept.id}
                    title={concept.name}
                    hint={`Grade ${concept.grade} · Chapter ${concept.chapter}`}
                    selected={selectedConceptId === concept.id}
                    onClick={() => setSelectedConceptId(concept.id)}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {tab === "curriculum" && (
          <section className="grid gap-3 xl:grid-cols-3">
            <ColumnPanel title="Grade" count={grades.length}>
              {grades.map((grade) => (
                <BlockCard
                  key={grade}
                  title={`Grade ${grade}`}
                  selected={curGrade === grade}
                  onClick={() => {
                    setCurGrade(grade);
                    setCurChapter(null);
                  }}
                />
              ))}
            </ColumnPanel>

            <ColumnPanel
              title="Chapter"
              count={curChapters.length}
              empty={curChapters.length === 0 ? "Select grade first." : undefined}
            >
              {curChapters.map((chapter) => (
                <BlockCard
                  key={chapter}
                  title={chapter}
                  selected={curChapter === chapter}
                  onClick={() => setCurChapter(chapter)}
                />
              ))}
            </ColumnPanel>

            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Topics</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{curTopics.length}</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {curTopics.map((topic) => (
                  <BlockCard key={topic} title={topic} />
                ))}
              </div>
              {curChapter && curTopics.length === 0 && <p className="mt-2 text-xs text-slate-500">No topics in this selection.</p>}
            </div>
          </section>
        )}

        {tab === "concept-overview" && (
          <section className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                All Concepts (grouped by Grade → Chapter)
              </h3>

              {groupedConcepts.map(([grade, chapterMap]) => (
                <div key={grade} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Grade {grade}</p>
                  {Array.from(chapterMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([chapter, items]) => (
                      <div key={`${grade}:${chapter}`} className="mb-3">
                        <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Chapter: {chapter}</p>
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {items.map((concept) => (
                            <BlockCard
                              key={concept.id}
                              title={concept.name}
                              hint={concept.parentConcept}
                              selected={selectedConceptId === concept.id}
                              onClick={() => setSelectedConceptId(concept.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Downward Flow</h3>
                {!selectedConcept && (
                  <p className="text-sm text-slate-500">
                    Select a concept to view Concept → Topic → Chapter → Parent Concept flow.
                  </p>
                )}
                {selectedConcept && (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-sm">
                      <span className="font-semibold">Concept:</span> {selectedConcept.name}
                    </div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                      <span className="font-semibold">Topic:</span> {selectedConcept.topic}
                    </div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                      <span className="font-semibold">Chapter:</span> {selectedConcept.chapter}
                    </div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm">
                      <span className="font-semibold">Parent Concept:</span> {selectedConcept.parentConcept}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
                {!selectedConcept && <p className="text-sm text-slate-500">Select a concept block to inspect details.</p>}
                {selectedConcept && (
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="font-semibold">Description:</span> {parsed.description || selectedConcept.description || "—"}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="font-semibold">Misconception:</span> {parsed.misconception || "—"}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="font-semibold">Types:</span> {parsed.types || "—"}
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                      <span className="font-semibold">Grade:</span> {selectedConcept.grade}
                    </div>
                  </div>
                )}
              </div>

              {selectedConcept && (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Related Concepts</h3>
                  <div className="space-y-2">
                    {relatedConcepts.length === 0 && <p className="text-xs text-slate-500">No close sibling concepts in this filtered set.</p>}
                    {relatedConcepts.map((concept) => (
                      <BlockCard
                        key={concept.id}
                        title={concept.name}
                        hint={`Same parent/chapter · ${concept.topic}`}
                        onClick={() => setSelectedConceptId(concept.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
