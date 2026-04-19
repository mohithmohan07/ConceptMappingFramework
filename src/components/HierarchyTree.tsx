import type { ReactNode } from "react";
import type { ConceptNode, ParentConceptNode } from "../data/types";
import {
  keyChapter,
  keyGrade,
  keyParent,
  keyTopic,
} from "../data/expandKeys";
import { HighlightLine } from "../lib/highlight";

type Props = {
  tree: ParentConceptNode[];
  expanded: Set<string>;
  toggle: (key: string) => void;
  query: string;
  onConceptClick: (c: ConceptNode) => void;
};

function Chevron({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      aria-hidden
    >
      <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
      </svg>
    </span>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {children}
    </span>
  );
}

export function HierarchyTree({ tree, expanded, toggle, query, onConceptClick }: Props) {
  return (
    <div className="space-y-3">
      {tree.map((p) => {
        const pk = keyParent(p.parentConcept);
        const pOpen = expanded.has(pk);
        return (
          <section
            key={pk}
            className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-soft dark:border-slate-700/80 dark:bg-slate-900"
          >
            <button
              type="button"
              className="flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
              onClick={() => toggle(pk)}
              aria-expanded={pOpen}
            >
              <Chevron open={pOpen} />
              <div className="min-w-0 flex-1">
                <span className="font-display text-base font-semibold text-slate-900 dark:text-white">
                  <HighlightLine text={p.parentConcept} query={query} />
                </span>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Parent learning structure
                </p>
              </div>
              <Badge>{p.grades.length}</Badge>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                pOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-slate-100 px-3 pb-3 dark:border-slate-800">
                  {p.grades.map((g) => {
                    const gk = keyGrade(p.parentConcept, g.grade);
                    const gOpen = expanded.has(gk);
                    return (
                      <div key={gk} className="mt-2">
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-indigo-50/80 dark:hover:bg-indigo-950/30"
                          onClick={() => toggle(gk)}
                          aria-expanded={gOpen}
                        >
                          <Chevron open={gOpen} />
                          <span className="font-medium text-slate-800 dark:text-slate-100">
                            Grade{" "}
                            <HighlightLine text={g.grade} query={query} />
                          </span>
                          <Badge>{g.chapters.length}</Badge>
                        </button>

                        <div
                          className={`ms-6 grid border-l border-slate-200/80 ps-3 transition-[grid-template-rows] duration-200 ease-out dark:border-slate-700 ${
                            gOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                          }`}
                        >
                          <div className="overflow-hidden">
                            {g.chapters.map((ch) => {
                              const ck = keyChapter(p.parentConcept, g.grade, ch.chapter);
                              const cOpen = expanded.has(ck);
                              return (
                                <div key={ck} className="mt-1">
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    onClick={() => toggle(ck)}
                                    aria-expanded={cOpen}
                                  >
                                    <Chevron open={cOpen} />
                                    <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-200">
                                      <HighlightLine text={ch.chapter} query={query} />
                                    </span>
                                    <Badge>{ch.topics.length}</Badge>
                                  </button>

                                  <div
                                    className={`ms-5 grid border-l border-slate-200/70 ps-2 transition-[grid-template-rows] duration-200 ease-out dark:border-slate-700 ${
                                      cOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                    }`}
                                  >
                                    <div className="overflow-hidden">
                                      {ch.topics.map((top) => {
                                        const tk = keyTopic(
                                          p.parentConcept,
                                          g.grade,
                                          ch.chapter,
                                          top.topic,
                                        );
                                        const tOpen = expanded.has(tk);
                                        return (
                                          <div key={tk} className="mt-1">
                                            <button
                                              type="button"
                                              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-violet-50/70 dark:hover:bg-violet-950/25"
                                              onClick={() => toggle(tk)}
                                              aria-expanded={tOpen}
                                            >
                                              <Chevron open={tOpen} />
                                              <span className="min-w-0 flex-1 text-slate-600 dark:text-slate-300">
                                                <HighlightLine text={top.topic} query={query} />
                                              </span>
                                              <Badge>{top.concepts.length}</Badge>
                                            </button>

                                            <div
                                              className={`ms-5 grid border-l border-violet-200/60 ps-2 transition-[grid-template-rows] duration-200 ease-out dark:border-violet-900/50 ${
                                                tOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                              }`}
                                            >
                                              <div className="overflow-hidden py-1">
                                                <ul className="space-y-1">
                                                  {top.concepts.map((c, ci) => (
                                                    <li key={`${tk}:${ci}:${c.name}`}>
                                                      <button
                                                        type="button"
                                                        onClick={() => onConceptClick(c)}
                                                        className="w-full rounded-lg px-3 py-2 text-left text-sm text-indigo-700 transition hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                                                      >
                                                        <HighlightLine text={c.name} query={query} />
                                                      </button>
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
