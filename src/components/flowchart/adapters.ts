import type { ParentConceptNode } from "../../data/types";
import type { NormalizedConcept } from "./types";

function safeNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function normalizeConcepts(tree: ParentConceptNode[]): NormalizedConcept[] {
  const result: NormalizedConcept[] = [];
  const seen = new Set<string>();

  for (const parent of tree) {
    for (const grade of parent.grades) {
      for (const chapter of grade.chapters) {
        for (const topic of chapter.topics) {
          for (const concept of topic.concepts) {
            const key = `${concept.name}|${parent.parentConcept}|${chapter.chapter}|${topic.topic}|${grade.grade}`;
            if (seen.has(key)) continue;
            seen.add(key);

            const extra = concept.meta as Record<string, unknown>;
            result.push({
              id: key,
              name: concept.name,
              description: concept.description || "",
              chapter: chapter.chapter,
              topic: topic.topic,
              parentConcept: parent.parentConcept,
              grade: grade.grade,
              subject: typeof extra.subject === "string" ? extra.subject : undefined,
              coverage: safeNumber(extra.coverage),
              gapScore: safeNumber(extra.gapScore),
              priority: safeNumber(extra.priority),
              mastery: safeNumber(extra.mastery),
            });
          }
        }
      }
    }
  }

  return result;
}

export function getFilterOptions(concepts: NormalizedConcept[]) {
  const grades = Array.from(new Set(concepts.map((c) => c.grade))).sort((a, b) => a.localeCompare(b));
  const subjects = Array.from(new Set(concepts.map((c) => c.subject).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b),
  );
  const chapters = Array.from(new Set(concepts.map((c) => c.chapter))).sort((a, b) => a.localeCompare(b));
  const parentConcepts = Array.from(new Set(concepts.map((c) => c.parentConcept))).sort((a, b) =>
    a.localeCompare(b),
  );

  return { grades, subjects, chapters, parentConcepts };
}
