/** One flat row from Excel / JSON export (flexible keys from pandas). */
export type SourceRow = Record<string, unknown>;

export type ConceptMeta = {
  grade: string;
  chapter: string;
  topic: string;
  parentConcept: string;
};

export type ConceptNode = {
  name: string;
  description: string;
  meta: ConceptMeta;
};

export type TopicNode = {
  topic: string;
  concepts: ConceptNode[];
};

export type ChapterNode = {
  chapter: string;
  topics: TopicNode[];
};

export type GradeNode = {
  grade: string;
  chapters: ChapterNode[];
};

export type ParentConceptNode = {
  parentConcept: string;
  grades: GradeNode[];
};

export type ParsedDescription = {
  raw: string;
  description?: string;
  types?: string;
  misconception?: string;
};
