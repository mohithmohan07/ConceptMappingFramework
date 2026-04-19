/**
 * Source column → application field mapping (Excel / CSV export).
 *
 * | Excel column           | Used as                         | Notes |
 * |------------------------|----------------------------------|-------|
 * | Parent Concept         | parentConcept, hierarchy level   | Top tree node |
 * | Grade                  | grade                            | Coerced to string; sorted numerically |
 * | Chapter Title          | chapter                          | "Chapter Name" in UX |
 * | Topic                  | topic (cleaned)                 | Trailing ` (CODE)` removed |
 * | Display Name           | concept label (name)            | Primary visible label |
 * | Concept                | fallback label only             | Used if Display Name empty; trailing code stripped |
 * | Concept Description    | description + modal body        | Shown verbatim; optional structured parse |
 *
 * Columns intentionally not surfaced in the UI:
 * Concept ID, Chapter Code, MMD Path, PDF Path, Board, Book, Subject, Chapter No (unless needed internally).
 *
 * chapterNo may be used only for stable ordering when titles repeat (not shown in hierarchy labels).
 */

export const COLUMN_MAP_DOC = `
Parent Concept → parentConcept
Grade → grade (string)
Chapter Title → chapter
Topic → topic (clean trailing bracket suffix)
Display Name → concept.name (visible)
Concept → fallback name if Display Name missing
Concept Description → concept.description + modal
`;
