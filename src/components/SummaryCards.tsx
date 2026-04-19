import type { CountSummary } from "../data/transformToHierarchy";

const items: { key: keyof CountSummary; label: string; hint: string }[] = [
  { key: "parentConcepts", label: "Parent concepts", hint: "Cross-grade learning arcs" },
  { key: "grades", label: "Grades", hint: "Vertical curriculum span" },
  { key: "chapters", label: "Chapters", hint: "NCERT chapter spine" },
  { key: "topics", label: "Topics", hint: "Instructional units" },
  { key: "concepts", label: "Concepts", hint: "Granular teach points" },
];

export function SummaryCards({ counts }: { counts: CountSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map(({ key, label, hint }) => (
        <div
          key={key}
          className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition hover:border-indigo-200/80 dark:border-slate-700/80 dark:bg-slate-900 dark:hover:border-indigo-500/30"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            {label}
          </p>
          <p className="font-display mt-2 text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">
            {counts[key].toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
        </div>
      ))}
    </div>
  );
}
