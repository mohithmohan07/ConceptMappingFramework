export type FlowTab = "focus-gaps" | "library" | "curriculum" | "concept-overview";

export type NodeKind = "chapter" | "topic" | "parent" | "concept";

export type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

export type GraphNode = {
  id: string;
  label: string;
  kind: NodeKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  meta?: Record<string, string | number | undefined>;
  tooltip?: string;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type GraphModel = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type NormalizedConcept = {
  id: string;
  name: string;
  description: string;
  chapter: string;
  topic: string;
  parentConcept: string;
  grade: string;
  subject?: string;
  coverage?: number;
  gapScore?: number;
  priority?: number;
  mastery?: number;
};

export type FlowFilters = {
  grade: string;
  subject: string;
  chapter: string;
  parentConcept: string;
};
