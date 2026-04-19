import { useEffect } from "react";
import type { ConceptNode } from "../data/types";
import { parseConceptDescription } from "../lib/parseDescription";

type Props = {
  concept: ConceptNode | null;
  onClose: () => void;
};

export function ConceptModal({ concept, onClose }: Props) {
  useEffect(() => {
    if (!concept) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [concept, onClose]);

  if (!concept) return null;

  const parsed = parseConceptDescription(concept.description);
  const crumb = [
    concept.meta.parentConcept,
    `Grade ${concept.meta.grade}`,
    concept.meta.chapter,
    concept.meta.topic,
  ].join(" > ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="concept-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity dark:bg-black/60"
        aria-label="Close overlay"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(92vh,880px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200/80 bg-white shadow-soft-lg dark:border-slate-700/80 dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Concept detail
            </p>
            <h2
              id="concept-modal-title"
              className="font-display mt-1 text-xl font-semibold leading-snug text-slate-900 dark:text-white"
            >
              {concept.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{crumb}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav
          className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-6 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-300"
          aria-label="Breadcrumb"
        >
          <ol className="flex flex-wrap gap-x-1.5 gap-y-1">
            {[
              concept.meta.parentConcept,
              `Grade ${concept.meta.grade}`,
              concept.meta.chapter,
              concept.meta.topic,
            ].map((part, i, arr) => (
              <li key={i} className="flex items-center gap-1.5">
                <span className="max-w-[220px] truncate font-medium">{part}</span>
                {i < arr.length - 1 && (
                  <span className="text-slate-400 dark:text-slate-500" aria-hidden>
                    {">"}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {parsed.description || parsed.types || parsed.misconception ? (
            <div className="space-y-6">
              {parsed.description && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Description</h3>
                  <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-slate-600 dark:prose-invert dark:text-slate-300">
                    {parsed.description}
                  </div>
                </section>
              )}
              {parsed.types && (
                <section>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Types</h3>
                  <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-slate-600 dark:prose-invert dark:text-slate-300">
                    {parsed.types}
                  </div>
                </section>
              )}
              {parsed.misconception && (
                <section>
                  <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                    Misconception
                  </h3>
                  <div className="prose prose-sm mt-2 max-w-none whitespace-pre-wrap text-slate-600 dark:prose-invert dark:text-slate-300">
                    {parsed.misconception}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {parsed.raw || "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
