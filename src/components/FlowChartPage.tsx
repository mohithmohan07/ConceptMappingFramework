import { useMemo, useState } from "react";
import type { ParentConceptNode } from "../data/types";
import { normalizeConcepts, getFilterOptions } from "./flowchart/adapters";
import type { FlowFilters, FlowTab, NormalizedConcept } from "./flowchart/types";
import { parseConceptDescription } from "../lib/parseDescription";

type Props = {
  tree: ParentConceptNode[];
  onBack: () => void;
};

function cls(active: boolean) {
  return active
    ? "border-indigo-300 bg-indigo-50 text-indigo-900"
    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
}

function TabButton({ active, label, subtitle, onClick }: { active: boolean; label: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-xl border p-3 text-left transition ${cls(active)}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-1 text-xs opacity-80">{subtitle}</p>
    </button>
  );
}

function Block({ title, selected, hint, onClick }: { title: string; selected?: boolean; hint?: string; onClick?: () => void }) {
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

function applyFilters(concepts: NormalizedConcept[], query: string, filters: FlowFilters) {
  const q = query.trim().toLowerCase();
  return concepts.filter((c) => {
    const hit = q.length === 0 || [c.name, c.chapter, c.topic, c.parentConcept, c.description].join(" ").toLowerCase().includes(q);
    return hit && (!filters.grade || c.grade === filters.grade) && (!filters.subject || c.subject === filters.subject) && (!filters.chapter || c.chapter === filters.chapter) && (!filters.parentConcept || c.parentConcept === filters.parentConcept);
  });
}

export function FlowChartPage({ tree, onBack }: Props) {
  const [tab, setTab] = useState<FlowTab>("focus-gaps");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<FlowFilters>({ grade: "", subject: "", chapter: "", parentConcept: "" });

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

  const grades = useMemo(() => Array.from(new Set(filtered.map((c) => c.grade))).sort((a, b) => a.localeCompare(b)), [filtered]);
  const chapters = useMemo(() => Array.from(new Set(filtered.filter((c) => c.grade === fgGrade).map((c) => c.chapter))).sort((a,b)=>a.localeCompare(b)), [filtered, fgGrade]);
  const topics = useMemo(() => Array.from(new Set(filtered.filter((c) => c.grade===fgGrade && c.chapter===fgChapter).map((c) => c.topic))).sort((a,b)=>a.localeCompare(b)), [filtered, fgGrade, fgChapter]);
  const fgConcepts = useMemo(() => filtered.filter((c) => c.grade===fgGrade && c.chapter===fgChapter && c.topic===fgTopic), [filtered, fgGrade, fgChapter, fgTopic]);
  const fgParentConcepts = useMemo(() => {
    if (fgConcept) {
      const chosen = fgConcepts.find((c) => c.id === fgConcept);
      return chosen ? [chosen.parentConcept] : [];
    }
    return Array.from(new Set(fgConcepts.map((c) => c.parentConcept))).sort((a, b) => a.localeCompare(b));
  }, [fgConcepts, fgConcept]);

  const libraryParents = useMemo(() => Array.from(new Set(filtered.map((c) => c.parentConcept))).sort((a,b)=>a.localeCompare(b)), [filtered]);
  const libraryConcepts = useMemo(() => filtered.filter((c) => c.parentConcept === libraryParent), [filtered, libraryParent]);

  const curChapters = useMemo(() => Array.from(new Set(filtered.filter((c) => c.grade === curGrade).map((c) => c.chapter))).sort((a,b)=>a.localeCompare(b)), [filtered, curGrade]);
  const curTopics = useMemo(() => Array.from(new Set(filtered.filter((c) => c.grade===curGrade && c.chapter===curChapter).map((c) => c.topic))).sort((a,b)=>a.localeCompare(b)), [filtered, curGrade, curChapter]);

  const groupedConcepts = useMemo(() => {
    const map = new Map<string, Map<string, NormalizedConcept[]>>();
    filtered.forEach((c) => {
      if (!map.has(c.grade)) map.set(c.grade, new Map());
      const byChapter = map.get(c.grade)!;
      if (!byChapter.has(c.chapter)) byChapter.set(c.chapter, []);
      byChapter.get(c.chapter)!.push(c);
    });
    return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]));
  }, [filtered]);

  const selectedConcept = filtered.find((c) => c.id === selectedConceptId) ?? null;
  const parsed = parseConceptDescription(selectedConcept?.description ?? "");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-4">
        <header className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Flow Chart Workspace</h1>
              <p className="text-sm text-slate-500">Block-wise open flow as requested.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setFgGrade(null); setFgChapter(null); setFgTopic(null); setFgConcept(null);
                  setLibraryParent(null); setCurGrade(null); setCurChapter(null); setSelectedConceptId(null);
                }}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm"
              >Reset selection</button>
              <button type="button" onClick={onBack} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm">Back to hierarchy</button>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <TabButton active={tab === "focus-gaps"} onClick={() => setTab("focus-gaps")} label="Focus Gaps Flow Chart" subtitle="Grade → Chapter → Topic → Concept → Parent" />
            <TabButton active={tab === "library"} onClick={() => setTab("library")} label="Library Flow Chart" subtitle="Parent Concept → Concepts" />
            <TabButton active={tab === "curriculum"} onClick={() => setTab("curriculum")} label="Curriculum Flow Chart" subtitle="Grade → Chapter → Topics" />
            <TabButton active={tab === "concept-overview"} onClick={() => setTab("concept-overview")} label="Concepts - Parent Concepts Flow Chart" subtitle="Concept-first grouped by grade/chapter" />
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
          <section className="grid gap-3 xl:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Grade</h3>{grades.map((g)=><Block key={g} title={`Grade ${g}`} selected={fgGrade===g} onClick={()=>{setFgGrade(g);setFgChapter(null);setFgTopic(null);setFgConcept(null);}} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Chapter</h3>{chapters.length===0 && <p className="text-xs text-slate-500">Select grade first.</p>}{chapters.map((c)=><Block key={c} title={c} selected={fgChapter===c} onClick={()=>{setFgChapter(c);setFgTopic(null);setFgConcept(null);}} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Topic</h3>{topics.length===0 && <p className="text-xs text-slate-500">Select chapter first.</p>}{topics.map((t)=><Block key={t} title={t} selected={fgTopic===t} onClick={()=>{setFgTopic(t);setFgConcept(null);}} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Concepts</h3>{fgConcepts.length===0 && <p className="text-xs text-slate-500">Select topic first.</p>}{fgConcepts.map((c)=><Block key={c.id} title={c.name} hint={`Gap ${c.gapScore ?? "-"} · Coverage ${c.coverage ?? "-"}`} selected={fgConcept===c.id} onClick={()=>{setFgConcept(c.id);setSelectedConceptId(c.id);}} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Parent Concept</h3>{fgParentConcepts.length===0 && <p className="text-xs text-slate-500">Select concept/topic first.</p>}{fgParentConcepts.map((p)=><Block key={p} title={p} />)}</div>
          </section>
        )}

        {tab === "library" && (
          <section className="grid gap-3 xl:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Parent Concepts</h3>{libraryParents.map((p)=><Block key={p} title={p} selected={libraryParent===p} onClick={()=>setLibraryParent(p)} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Concepts</h3><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{libraryConcepts.map((c)=><Block key={c.id} title={c.name} hint={`Grade ${c.grade} · Chapter ${c.chapter}`} selected={selectedConceptId===c.id} onClick={()=>setSelectedConceptId(c.id)} />)}</div></div>
          </section>
        )}

        {tab === "curriculum" && (
          <section className="grid gap-3 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Grade</h3>{grades.map((g)=><Block key={g} title={`Grade ${g}`} selected={curGrade===g} onClick={()=>{setCurGrade(g);setCurChapter(null);}} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"><h3 className="text-xs font-semibold uppercase text-slate-500">Chapter</h3>{curChapters.length===0 && <p className="text-xs text-slate-500">Select grade first.</p>}{curChapters.map((c)=><Block key={c} title={c} selected={curChapter===c} onClick={()=>setCurChapter(c)} />)}</div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"><h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Topics</h3><div className="grid gap-2 sm:grid-cols-2">{curTopics.map((t)=><Block key={t} title={t} />)}</div>{curChapter && curTopics.length===0 && <p className="mt-2 text-xs text-slate-500">No topics in this selection.</p>}</div>
          </section>
        )}

        {tab === "concept-overview" && (
          <section className="grid gap-3 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm space-y-4">
              <h3 className="text-xs font-semibold uppercase text-slate-500">All Concepts (grouped by Grade → Chapter)</h3>
              {groupedConcepts.map(([grade, chapterMap]) => (
                <div key={grade} className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-sm font-semibold text-slate-700">Grade {grade}</p>
                  {Array.from(chapterMap.entries()).sort((a,b)=>a[0].localeCompare(b[0])).map(([chapter, list]) => (
                    <div key={`${grade}:${chapter}`} className="mb-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Chapter: {chapter}</p>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                        {list.map((c) => <Block key={c.id} title={c.name} hint={c.parentConcept} selected={selectedConceptId===c.id} onClick={()=>setSelectedConceptId(c.id)} />)}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Downward Flow</h3>
                {!selectedConcept && <p className="text-sm text-slate-500">Select a concept to view Concept → Chapter → Parent Concept flow.</p>}
                {selectedConcept && (
                  <div className="space-y-2">
                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-2 text-sm"><span className="font-semibold">Concept:</span> {selectedConcept.name}</div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Topic:</span> {selectedConcept.topic}</div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Chapter:</span> {selectedConcept.chapter}</div>
                    <div className="text-center text-slate-400">↓</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm"><span className="font-semibold">Parent Concept:</span> {selectedConcept.parentConcept}</div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500">Details</h3>
                {!selectedConcept && <p className="text-sm text-slate-500">Select a concept block to inspect details.</p>}
                {selectedConcept && (
                  <div className="space-y-2 text-sm">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="font-semibold">Description:</span> {parsed.description || selectedConcept.description || "—"}</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="font-semibold">Misconception:</span> {parsed.misconception || "—"}</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="font-semibold">Types:</span> {parsed.types || "—"}</div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2"><span className="font-semibold">Grade:</span> {selectedConcept.grade}</div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
