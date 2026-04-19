import type {
  ChapterNode,
  ConceptNode,
  GradeNode,
  ParentConceptNode,
  SourceRow,
  TopicNode,
} from "./types";

/** Removes trailing ` (SOME_CODE)` suffix from topic or concept labels. */
export function cleanTrailingCode(label: string | undefined | null): string {
  if (!label) return "";
  return label.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v).trim();
}

function conceptLabel(row: SourceRow): string {
  const display = str(row.displayName ?? row["Display Name"]);
  if (display) return cleanTrailingCode(display);
  const raw = str(row.Concept ?? row["Concept"]);
  return cleanTrailingCode(raw);
}

function gradeSortKey(grade: string): number {
  const n = parseInt(grade.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

export function compareGrades(a: string, b: string): number {
  const da = gradeSortKey(a);
  const db = gradeSortKey(b);
  if (da !== db) return da - db;
  return a.localeCompare(b, undefined, { numeric: true });
}

type MutableTopic = {
  firstIndex: number;
  conceptKeys: Set<string>;
  concepts: ConceptNode[];
};

type MutableChapter = {
  firstIndex: number;
  topics: Map<string, MutableTopic>;
};

type MutableGrade = {
  firstIndex: number;
  chapters: Map<string, MutableChapter>;
};

type MutableParent = {
  firstIndex: number;
  grades: Map<string, MutableGrade>;
};

/**
 * Converts flat curriculum rows into a deduplicated hierarchy:
 * Parent Concept → Grade → Chapter → Topic → Concepts
 */
export function rowsToHierarchy(rows: SourceRow[]): ParentConceptNode[] {
  let seq = 0;
  const parents = new Map<string, MutableParent>();

  const getParent = (name: string): MutableParent => {
    let p = parents.get(name);
    if (!p) {
      p = { firstIndex: seq++, grades: new Map() };
      parents.set(name, p);
    }
    return p;
  };

  const getGrade = (p: MutableParent, grade: string): MutableGrade => {
    let g = p.grades.get(grade);
    if (!g) {
      g = { firstIndex: seq++, chapters: new Map() };
      p.grades.set(grade, g);
    }
    return g;
  };

  const getChapter = (g: MutableGrade, chapter: string): MutableChapter => {
    let c = g.chapters.get(chapter);
    if (!c) {
      c = { firstIndex: seq++, topics: new Map() };
      g.chapters.set(chapter, c);
    }
    return c;
  };

  const getTopic = (c: MutableChapter, topic: string): MutableTopic => {
    let t = c.topics.get(topic);
    if (!t) {
      t = { firstIndex: seq++, conceptKeys: new Set(), concepts: [] };
      c.topics.set(topic, t);
    }
    return t;
  };

  for (const row of rows) {
    const parentConcept =
      str(row.parentConcept ?? row["Parent Concept"]) || "(Uncategorized)";
    const gradeRaw = str(row.Grade ?? row["grade"]);
    const grade = gradeRaw || "(Unknown grade)";
    const chapter = str(row.chapterTitle ?? row["Chapter Title"]) || "(Untitled chapter)";
    const topicRaw = str(row.Topic ?? row["topic"]);
    const topic = cleanTrailingCode(topicRaw) || "(Untitled topic)";
    const name = conceptLabel(row);
    if (!name) continue;

    const description = str(row.conceptDescription ?? row["Concept Description"]);
    const concept: ConceptNode = {
      name,
      description,
      meta: {
        grade,
        chapter,
        topic,
        parentConcept,
      },
    };

    const p = getParent(parentConcept);
    const g = getGrade(p, grade);
    const ch = getChapter(g, chapter);
    const top = getTopic(ch, topic);

    const dedupeKey = `${name}\u0000${description}`;
    if (top.conceptKeys.has(dedupeKey)) continue;
    top.conceptKeys.add(dedupeKey);
    top.concepts.push(concept);
  }

  const parentsSorted = [...parents.entries()].sort((a, b) => a[1].firstIndex - b[1].firstIndex);

  return parentsSorted.map(([parentConcept, p]) => {
    const grades = [...p.grades.entries()]
      .sort((a, b) => compareGrades(a[0], b[0]))
      .map(([grade, g]) => {
        const chapters = [...g.chapters.entries()]
          .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
          .map(([chapter, c]) => {
            const topics = [...c.topics.entries()]
              .sort((a, b) => a[1].firstIndex - b[1].firstIndex)
              .map(([topic, t]) => ({
                topic,
                concepts: t.concepts,
              } satisfies TopicNode));
            return { chapter, topics } satisfies ChapterNode;
          });
        return { grade, chapters } satisfies GradeNode;
      });
    return { parentConcept, grades };
  });
}

export type CountSummary = {
  parentConcepts: number;
  grades: number;
  chapters: number;
  topics: number;
  concepts: number;
};

export function summarizeHierarchy(tree: ParentConceptNode[]): CountSummary {
  const gradeSet = new Set<string>();
  const chapterSet = new Set<string>();
  const topicSet = new Set<string>();
  let concepts = 0;

  for (const p of tree) {
    for (const g of p.grades) {
      gradeSet.add(`${p.parentConcept}\t${g.grade}`);
      for (const c of g.chapters) {
        chapterSet.add(`${p.parentConcept}\t${g.grade}\t${c.chapter}`);
        for (const t of c.topics) {
          topicSet.add(`${p.parentConcept}\t${g.grade}\t${c.chapter}\t${t.topic}`);
          concepts += t.concepts.length;
        }
      }
    }
  }

  return {
    parentConcepts: tree.length,
    grades: gradeSet.size,
    chapters: chapterSet.size,
    topics: topicSet.size,
    concepts,
  };
}
