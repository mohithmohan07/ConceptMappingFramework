import type {
  ChapterNode,
  ConceptNode,
  GradeNode,
  ParentConceptNode,
  TopicNode,
} from "../data/types";

function includes(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle);
}

function conceptMatches(c: ConceptNode, q: string): boolean {
  return (
    includes(c.name, q) ||
    includes(c.description, q) ||
    includes(c.meta.parentConcept, q) ||
    includes(c.meta.grade, q) ||
    includes(c.meta.chapter, q) ||
    includes(c.meta.topic, q)
  );
}

function filterTopics(topics: TopicNode[], q: string): TopicNode[] {
  const out: TopicNode[] = [];
  for (const t of topics) {
    const topicHit = includes(t.topic, q);
    if (topicHit) {
      out.push(t);
      continue;
    }
    const concepts = t.concepts.filter((c) => conceptMatches(c, q));
    if (concepts.length) {
      out.push({ ...t, concepts });
    }
  }
  return out;
}

function filterChapters(chapters: ChapterNode[], q: string): ChapterNode[] {
  const out: ChapterNode[] = [];
  for (const ch of chapters) {
    if (includes(ch.chapter, q)) {
      out.push(ch);
      continue;
    }
    const topics = filterTopics(ch.topics, q);
    if (topics.length) {
      out.push({ ...ch, topics });
    }
  }
  return out;
}

function filterGrades(grades: GradeNode[], q: string): GradeNode[] {
  const out: GradeNode[] = [];
  for (const g of grades) {
    if (includes(g.grade, q)) {
      out.push(g);
      continue;
    }
    const chapters = filterChapters(g.chapters, q);
    if (chapters.length) {
      out.push({ ...g, chapters });
    }
  }
  return out;
}

/** Returns a pruned tree containing only branches that match the query. */
export function filterHierarchy(
  tree: ParentConceptNode[],
  query: string,
): ParentConceptNode[] {
  const q = query.trim();
  if (!q) return tree;

  const out: ParentConceptNode[] = [];
  for (const p of tree) {
    if (includes(p.parentConcept, q)) {
      out.push(p);
      continue;
    }
    const grades = filterGrades(p.grades, q);
    if (grades.length) {
      out.push({ ...p, grades });
    }
  }
  return out;
}
