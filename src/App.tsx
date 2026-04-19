import { useCallback, useEffect, useMemo, useState } from "react";
import { ConceptModal } from "./components/ConceptModal";
import { HierarchyTree } from "./components/HierarchyTree";
import { SummaryCards } from "./components/SummaryCards";
import { FlowChartPage } from "./components/FlowChartPage";
import {
  collectAllExpandKeys,
  defaultExpandedKeys,
} from "./data/expandKeys";
import type { ConceptNode, SourceRow } from "./data/types";
import { filterHierarchy } from "./lib/filterHierarchy";
import { downloadCsv, flattenHierarchy } from "./lib/flattenHierarchy";
import {
  rowsToHierarchy,
  summarizeHierarchy,
} from "./data/transformToHierarchy";

async function loadRows(): Promise<SourceRow[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/concepts.json`);
  if (!res.ok) throw new Error(`Failed to load data (${res.status})`);
  return (await res.json()) as SourceRow[];
}

export default function App() {
  const [rows, setRows] = useState<SourceRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : false,
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<ConceptNode | null>(null);
  const [showFlowChart, setShowFlowChart] = useState(() =>
    typeof window !== "undefined" ? window.location.search.includes("view=flow") : false,
  );

  useEffect(() => {
    loadRows()
      .then(setRows)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const hierarchy = useMemo(() => (rows ? rowsToHierarchy(rows) : []), [rows]);

  const filtered = useMemo(
    () => filterHierarchy(hierarchy, query),
    [hierarchy, query],
  );

  const searchActive = query.trim().length > 0;

  useEffect(() => {
    setExpanded(defaultExpandedKeys(filtered, searchActive));
  }, [filtered, searchActive]);

  const counts = useMemo(() => summarizeHierarchy(filtered), [filtered]);

  const toggle = useCallback((key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpanded(collectAllExpandKeys(filtered));
  }, [filtered]);

  const collapseAll = useCallback(() => {
    setExpanded(new Set());
  }, []);

  const openFlowChart = useCallback(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", "flow");
      window.history.replaceState({}, "", url.toString());
    }
    setShowFlowChart(true);
  }, []);

  const backToHierarchy = useCallback(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      window.history.replaceState({}, "", url.toString());
    }
    setShowFlowChart(false);
  }, []);

  const exportCsv = useCallback(() => {
    const flat = flattenHierarchy(filtered);
    downloadCsv(flat, "concept-map-export.csv");
  }, [filtered]);

  if (showFlowChart) {
    return <FlowChartPage tree={filtered} onBack={backToHierarchy} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                Curriculum intelligence
              </p>
              <h1 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                Grade-wise concept mapping architecture
              </h1>
              <p className="mt-3 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
                This page maps how curriculum knowledge is connected across grades—from parent concepts to
                chapters, topics, and final learning concepts—so educators can quickly see progression,
                gaps, and dependencies instead of browsing isolated chapter lists.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openFlowChart}
                className="rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 dark:border-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200 dark:hover:border-indigo-500"
              >
                Open flow chart page
              </button>
              <button
                type="button"
                onClick={() => setDark((d) => !d)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
              >
                {dark ? "Light mode" : "Dark mode"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {loadError && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
            {loadError}
          </div>
        )}

        {!rows && !loadError && (
          <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-soft dark:border-slate-700 dark:bg-slate-900">
            Loading curriculum map…
          </div>
        )}

        {rows && (
          <>
            <SummaryCards counts={counts} />

            <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft dark:border-slate-700/80 dark:bg-slate-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-xl flex-1">
                  <label htmlFor="search" className="sr-only">
                    Search hierarchy
                  </label>
                  <input
                    id="search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search parent concept, grade, chapter, topic, or concept…"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 pl-11 pr-4 text-sm text-slate-900 shadow-inner outline-none ring-indigo-500/0 transition focus:border-indigo-300 focus:bg-white focus:ring-4 dark:border-slate-600 dark:bg-slate-800/80 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-slate-900"
                  />
                  <svg
                    className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={expandAll}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500"
                  >
                    Expand all
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Collapse all
                  </button>
                  <button
                    type="button"
                    onClick={exportCsv}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Download CSV
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <HierarchyTree
                tree={filtered}
                expanded={expanded}
                toggle={toggle}
                query={query}
                onConceptClick={setSelected}
              />
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200/80 py-8 text-center text-xs text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Demo visualization · hierarchy: Parent concept → Grade → Chapter → Topic → Concept
      </footer>

      <ConceptModal concept={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
