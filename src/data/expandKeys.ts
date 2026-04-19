import type { ParentConceptNode } from "./types";

export const keyParent = (parent: string) => JSON.stringify(["p", parent]);
export const keyGrade = (parent: string, grade: string) =>
  JSON.stringify(["g", parent, grade]);
export const keyChapter = (parent: string, grade: string, chapter: string) =>
  JSON.stringify(["c", parent, grade, chapter]);
export const keyTopic = (
  parent: string,
  grade: string,
  chapter: string,
  topic: string,
) => JSON.stringify(["t", parent, grade, chapter, topic]);

export function collectAllExpandKeys(tree: ParentConceptNode[]): Set<string> {
  const s = new Set<string>();
  for (const p of tree) {
    s.add(keyParent(p.parentConcept));
    for (const g of p.grades) {
      s.add(keyGrade(p.parentConcept, g.grade));
      for (const c of g.chapters) {
        s.add(keyChapter(p.parentConcept, g.grade, c.chapter));
        for (const t of c.topics) {
          s.add(keyTopic(p.parentConcept, g.grade, c.chapter, t.topic));
        }
      }
    }
  }
  return s;
}

export function defaultExpandedKeys(
  tree: ParentConceptNode[],
  searchActive: boolean,
): Set<string> {
  if (!tree.length) return new Set();
  if (searchActive) {
    return collectAllExpandKeys(tree);
  }
  const s = new Set<string>();
  for (const p of tree) {
    s.add(keyParent(p.parentConcept));
  }
  const first = tree[0];
  for (const g of first.grades) {
    s.add(keyGrade(first.parentConcept, g.grade));
  }
  return s;
}
