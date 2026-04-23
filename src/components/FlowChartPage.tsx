import { useMemo, useState } from "react";
import type { ParentConceptNode } from "../data/types";
import { normalizeConcepts, getFilterOptions } from "./flowchart/adapters";
import type { FlowFilters, FlowTab, NormalizedConcept } from "./flowchart/types";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

function cls(active: boolean) {
  return active
    ? "border-indigo-300 bg-indigo-50 text-indigo-900"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

function TabButton({
  active,
  label,
  onClick,
  subtitle,
}: {
  active: boolean;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-3 text-left transition ${cls(active)}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs opacity-80">{subtitle}</p>
    </button>
  );
}

function Block({
  title,
  selected,
  onClick,
  hint,
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
      className={`w-full rounded-xl border p-3 text-left transition ${selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
    >
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </button>
  );
}

function applyFilters(concepts: NormalizedConcept[], query: string, filters: FlowFilters) {
  const q = query.trim().toLowerCase();
  return concepts.filter((c) => {
    const hit =
      q.length === 0 ||
      [c.name, c.chapter, c.topic, c.parentConcept, c.description].join(" ").toLowerCase().includes(q);

    return (
      hit &&
      (!filters.grade || c.grade === filters.grade) &&
      (!filters.subject || c.subject === filters.subject) &&
      (!filters.chapter || c.chapter === filters.chapter) &&
      (!filters.parentConcept || c.parentConcept === filters.parentConcept)
    );
  });
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      {label}
      <select className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [tab, setTab] = useState<FlowTab>("focus-gaps");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FlowFilters>({ grade: "", subject: "", chapter: "", parentConcept: "" });

  const [focusChapter, setFocusChapter] = useState<string | null>(null);
  const [focusTopic, setFocusTopic] = useState<string | null>(null);
  const [focusParent, setFocusParent] = useState<string | null>(null);
  const [libraryParent, setLibraryParent] = useState<string | null>(null);
  const [curriculumChapter, setCurriculumChapter] = useState<string | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const concepts = useMemo(() => normalizeConcepts(tree), [tree]);
  const options = useMemo(() => getFilterOptions(concepts), [concepts]);
  const filtered = useMemo(() => applyFilters(concepts, query, filters), [concepts, query, filters]);

  const chapters = useMemo(() => Array.from(new Set(filtered.map((c) => c.chapter))).sort((a, b) => a.localeCompare(b)), [filtered]);
  const focusTopics = useMemo(() => Array.from(new Set(filtered.filter((c) => c.chapter === focusChapter).map((c) => c.topic))).sort((a,b)=>a.localeCompare(b)), [filtered, focusChapter]);
  const focusParents = useMemo(() => Array.from(new Set(filtered.filter((c) => c.chapter === focusChapter && c.topic === focusTopic).map((c) => c.parentConcept))).sort((a,b)=>a.localeCompare(b)), [filtered, focusChapter, focusTopic]);
  const focusConcepts = useMemo(() => filtered.filter((c) => c.chapter === focusChapter && c.topic === focusTopic && c.parentConcept === focusParent), [filtered, focusChapter, focusTopic, focusParent]);

  const libraryParents = useMemo(() => Array.from(new Set(filtered.map((c) => c.parentConcept))).sort((a,b)=>a.localeCompare(b)), [filtered]);
  const libraryConcepts = useMemo(() => filtered.filter((c) => c.parentConcept === libraryParent), [filtered, libraryParent]);

  const curriculumTopics = useMemo(() => Array.from(new Set(filtered.filter((c) => c.chapter === curriculumChapter).map((c) => c.topic))).sort((a,b)=>a.localeCompare(b)), [filtered, curriculumChapter]);
  const selectedConcept = filtered.find((c) => c.id === selectedConceptId) ?? null;

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Flow Chart Workspace</h1>
              <p className="text-sm text-slate-500">Block-wise exploration with progressive opening of levels.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFocusChapter(null); setFocusTopic(null); setFocusParent(null); setLibraryParent(null); setCurriculumChapter(null); setSelectedConceptId(null);
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
              >Reset selection</button>
              <button type="button" onClick={onBack} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm">Back to hierarchy</button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <TabButton active={tab === "focus-gaps"} onClick={() => setTab("focus-gaps")} label="Focus Gaps Flow Chart" subtitle="Chapter → Topic → Parent → Concept" />
            <TabButton active={tab === "library"} onClick={() => setTab("library")} label="Library Flow Chart" subtitle="Parent Concept → Concepts" />
            <TabButton active={tab === "curriculum"} onClick={() => setTab("curriculum")} label="Curriculum Flow Chart" subtitle="Chapter → Topics" />
            <TabButton active={tab === "concept-overview"} onClick={() => setTab("concept-overview")} label="Concepts Overview" subtitle="Concept-first block map" />
          </div>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-2 lg:grid-cols-[1.4fr_repeat(4,minmax(140px,1fr))]">
            <label className="flex flex-col gap-1 text-xs text-slate-600">Search
              <input value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Search chapter, topic, parent concept, concept" />
            </label>
            <Select label="Grade" value={filters.grade} options={options.grades} onChange={(v) => setFilters({ ...filters, grade: v })} />
            <Select label="Subject" value={filters.subject} options={options.subjects} onChange={(v) => setFilters({ ...filters, subject: v })} />
            <Select label="Chapter" value={filters.chapter} options={options.chapters} onChange={(v) => setFilters({ ...filters, chapter: v })} />
            <Select label="Parent Concept" value={filters.parentConcept} options={options.parentConcepts} onChange={(v) => setFilters({ ...filters, parentConcept: v })} />
          </div>
        </section>

        {tab === "focus-gaps" && (
          <section className="grid gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Chapter</h3>
              {chapters.map((ch) => <Block key={ch} title={ch} selected={focusChapter===ch} onClick={() => { setFocusChapter(ch); setFocusTopic(null); setFocusParent(null); }} />)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Topic</h3>
              {focusTopics.length===0 && <p className="text-xs text-slate-500">Open a chapter block first.</p>}
              {focusTopics.map((t) => <Block key={t} title={t} selected={focusTopic===t} onClick={() => { setFocusTopic(t); setFocusParent(null); }} />)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Parent Concept</h3>
              {focusParents.length===0 && <p className="text-xs text-slate-500">Open a topic block first.</p>}
              {focusParents.map((p) => <Block key={p} title={p} selected={focusParent===p} onClick={() => setFocusParent(p)} />)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Concepts</h3>
              {focusConcepts.length===0 && <p className="text-xs text-slate-500">Open a parent concept block first.</p>}
              {focusConcepts.map((c) => (
                <Block
                  key={c.id}
                  title={c.name}
                  hint={`Gap ${c.gapScore ?? "-"} · Coverage ${c.coverage ?? "-"}`}
                  selected={selectedConceptId===c.id}
                  onClick={() => setSelectedConceptId(c.id)}
                />
              ))}
            </div>
          </section>
        )}

        {tab === "library" && (
          <section className="grid gap-3 xl:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Parent Concepts</h3>
              {libraryParents.map((p) => <Block key={p} title={p} selected={libraryParent===p} onClick={() => setLibraryParent(p)} />)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Concept Library</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {libraryConcepts.map((c) => (
                  <Block key={c.id} title={c.name} hint={`Grade ${c.grade} · ${c.chapter} · ${c.topic}`} selected={selectedConceptId===c.id} onClick={() => setSelectedConceptId(c.id)} />
                ))}
              </div>
              {libraryParent && libraryConcepts.length===0 && <p className="mt-2 text-xs text-slate-500">No concepts for this parent concept in current filter.</p>}
            </div>
          </section>
        )}

        {tab === "curriculum" && (
          <section className="grid gap-3 xl:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2">
              <h3 className="text-xs font-semibold uppercase text-slate-500">Chapters</h3>
              {chapters.map((ch) => <Block key={ch} title={ch} selected={curriculumChapter===ch} onClick={() => setCurriculumChapter(ch)} />)}
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Topics</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {curriculumTopics.map((t) => <Block key={t} title={t} />)}
              </div>
              {curriculumChapter && curriculumTopics.length===0 && <p className="mt-2 text-xs text-slate-500">No topics in current filter.</p>}
            </div>
          </section>
        )}

        {tab === "concept-overview" && (
          <section className="grid gap-3 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Concept Blocks</h3>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => <Block key={c.id} title={c.name} hint={`${c.parentConcept} · ${c.topic}`} selected={selectedConceptId===c.id} onClick={() => setSelectedConceptId(c.id)} />)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Selected Concept Context</h3>
              {!selectedConcept && <p className="text-sm text-slate-500">Pick a concept block to inspect lineage.</p>}
              {selectedConcept && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Concept:</span> {selectedConcept.name}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Parent Concept:</span> {selectedConcept.parentConcept}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Topic:</span> {selectedConcept.topic}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Chapter:</span> {selectedConcept.chapter}</div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Description:</span> {selectedConcept.description || "—"}</div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
