import type { ParentConceptNode } from "../data/types";

/** Flatten visible hierarchy for CSV export (sales-friendly columns only). */
export function flattenHierarchy(tree: ParentConceptNode[]): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  for (const p of tree) {
    for (const g of p.grades) {
      for (const c of g.chapters) {
        for (const t of c.topics) {
          for (const concept of t.concepts) {
            rows.push({
              "Parent Concept": concept.meta.parentConcept,
              Grade: concept.meta.grade,
              "Chapter Title": concept.meta.chapter,
              Topic: concept.meta.topic,
              "Display Name": concept.name,
              "Concept Description": concept.description,
            });
          }
        }
      }
    }
  }
  return rows;
}

export function downloadCsv(rows: Record<string, string>[], filename: string): void {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h] ?? "")).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
