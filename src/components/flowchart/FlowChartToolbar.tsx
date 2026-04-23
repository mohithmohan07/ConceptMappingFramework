import type { FlowFilters } from "./types";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filters: FlowFilters;
  onFiltersChange: (next: FlowFilters) => void;
  options: {
    grades: string[];
    subjects: string[];
    chapters: string[];
    parentConcepts: string[];
  };
};

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
    <label className="flex min-w-[160px] flex-col gap-1 text-xs text-slate-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-700"
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

export function FlowChartToolbar({ query, onQueryChange, filters, onFiltersChange, options }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-2 lg:grid-cols-[1.4fr_repeat(4,minmax(140px,1fr))]">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Search
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search chapter, topic, parent concept, or concept"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
          />
        </label>

        <SelectField
          label="Grade"
          value={filters.grade}
          options={options.grades}
          onChange={(grade) => onFiltersChange({ ...filters, grade })}
        />
        <SelectField
          label="Subject"
          value={filters.subject}
          options={options.subjects}
          onChange={(subject) => onFiltersChange({ ...filters, subject })}
        />
        <SelectField
          label="Chapter"
          value={filters.chapter}
          options={options.chapters}
          onChange={(chapter) => onFiltersChange({ ...filters, chapter })}
        />
        <SelectField
          label="Parent Concept"
          value={filters.parentConcept}
          options={options.parentConcepts}
          onChange={(parentConcept) => onFiltersChange({ ...filters, parentConcept })}
        />
      </div>
    </section>
  );
}
