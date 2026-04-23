import type { FlowFilters, GraphLane, GraphModel, GraphNode, NormalizedConcept } from "./types";

function byFilters(concept: NormalizedConcept, query: string, filters: FlowFilters) {
  const q = query.trim().toLowerCase();
  const matchesQuery =
    q.length === 0 ||
    [concept.name, concept.chapter, concept.topic, concept.parentConcept, concept.description]
      .join(" ")
      .toLowerCase()
      .includes(q);

  return (
    matchesQuery &&
    (!filters.grade || concept.grade === filters.grade) &&
    (!filters.subject || concept.subject === filters.subject) &&
    (!filters.chapter || concept.chapter === filters.chapter) &&
    (!filters.parentConcept || concept.parentConcept === filters.parentConcept)
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function makeNode(
  id: string,
  label: string,
  kind: GraphNode["kind"],
  x: number,
  y: number,
  meta?: GraphNode["meta"],
): GraphNode {
  return {
    id,
    label,
    kind,
    x,
    y,
    width: kind === "chapter" ? 190 : kind === "concept" ? 180 : 170,
    height: 44,
    tooltip: label,
    meta,
  };
}

function makeCollector(lanes: GraphLane[]): {
  addNode: (node: GraphNode) => void;
  addEdge: (source: string, target: string) => void;
  toGraph: (emptyMessage?: string) => GraphModel;
} {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, { id: string; source: string; target: string }>();

  return {
    addNode(node) {
      if (!nodes.has(node.id)) nodes.set(node.id, node);
    },
    addEdge(source, target) {
      const id = `${source}->${target}`;
      if (!edges.has(id)) edges.set(id, { id, source, target });
    },
    toGraph(emptyMessage) {
      return {
        nodes: Array.from(nodes.values()),
        edges: Array.from(edges.values()),
        lanes,
        emptyMessage,
      };
    },
  };
}

export function buildFocusGapsGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const lanes = [
    { id: "chapter", label: "Chapter", x: 60, width: 230 },
    { id: "topic", label: "Topic", x: 350, width: 230 },
    { id: "parent", label: "Parent Concept", x: 640, width: 230 },
    { id: "concept", label: "Concept", x: 930, width: 230 },
  ];
  const collect = makeCollector(lanes);
  const filtered = concepts.filter((c) => byFilters(c, query, filters));

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    const chapterY = 90 + chapterIndex * 290;
    collect.addNode(makeNode(chapterId, chapter, "chapter", 80, chapterY));

    const chapterConcepts = filtered.filter((c) => c.chapter === chapter);
    uniqueSorted(chapterConcepts.map((c) => c.topic)).forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const topicY = chapterY - 10 + topicIndex * 76;
      collect.addNode(makeNode(topicId, topic, "topic", 370, topicY));
      collect.addEdge(chapterId, topicId);

      const topicConcepts = chapterConcepts.filter((c) => c.topic === topic);
      uniqueSorted(topicConcepts.map((c) => c.parentConcept)).forEach((parent, parentIndex) => {
        const parentId = `parent:${chapter}:${topic}:${parent}`;
        const parentY = topicY + parentIndex * 62;
        collect.addNode(makeNode(parentId, parent, "parent", 660, parentY));
        collect.addEdge(topicId, parentId);

        topicConcepts
          .filter((c) => c.parentConcept === parent)
          .forEach((concept, conceptIndex) => {
            const conceptId = `concept:${concept.id}`;
            const conceptY = parentY + conceptIndex * 52;
            collect.addNode(
              makeNode(conceptId, concept.name, "concept", 950, conceptY, {
                chapter: concept.chapter,
                topic: concept.topic,
                parentConcept: concept.parentConcept,
                grade: concept.grade,
                gapScore: concept.gapScore,
                coverage: concept.coverage,
                priority: concept.priority,
              }),
            );
            collect.addEdge(parentId, conceptId);
          });
      });
    });
  });

  return collect.toGraph("No chapter-to-concept paths found for selected filters.");
}

export function buildLibraryGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const lanes = [
    { id: "parent", label: "Parent Concept", x: 80, width: 300 },
    { id: "concept", label: "Concept Library", x: 430, width: 760 },
  ];
  const collect = makeCollector(lanes);
  const filtered = concepts.filter((c) => byFilters(c, query, filters));

  uniqueSorted(filtered.map((c) => c.parentConcept)).forEach((parent, parentIndex) => {
    const parentId = `parent:${parent}`;
    const parentY = 90 + parentIndex * 200;
    collect.addNode(makeNode(parentId, parent, "parent", 110, parentY));

    filtered
      .filter((c) => c.parentConcept === parent)
      .forEach((concept, index) => {
        const conceptId = `concept:${concept.id}`;
        const col = index % 4;
        const row = Math.floor(index / 4);
        collect.addNode(
          makeNode(conceptId, concept.name, "concept", 470 + col * 190, parentY - 20 + row * 58, {
            chapter: concept.chapter,
            topic: concept.topic,
            grade: concept.grade,
            description: concept.description,
          }),
        );
        collect.addEdge(parentId, conceptId);
      });
  });

  return collect.toGraph("No parent concept relationships found for selected filters.");
}

export function buildCurriculumGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const lanes = [
    { id: "chapter", label: "Chapter", x: 80, width: 280 },
    { id: "topic", label: "Topics", x: 400, width: 790 },
  ];
  const collect = makeCollector(lanes);
  const filtered = concepts.filter((c) => byFilters(c, query, filters));

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    const chapterY = 100 + chapterIndex * 170;
    collect.addNode(makeNode(chapterId, chapter, "chapter", 110, chapterY));

    uniqueSorted(filtered.filter((c) => c.chapter === chapter).map((c) => c.topic)).forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const col = topicIndex % 4;
      const row = Math.floor(topicIndex / 4);
      collect.addNode(makeNode(topicId, topic, "topic", 430 + col * 190, chapterY - 18 + row * 62));
      collect.addEdge(chapterId, topicId);
    });
  });

  return collect.toGraph("No chapter-to-topic curriculum map found for selected filters.");
}

export function buildConceptOverviewGraph(
  concepts: NormalizedConcept[],
  query: string,
  filters: FlowFilters,
  selectedNodeId?: string,
): GraphModel {
  const lanes = [
    { id: "cluster", label: "Concept Cluster", x: 80, width: 760 },
    { id: "lineage", label: "Lineage Trace", x: 900, width: 300 },
  ];
  const collect = makeCollector(lanes);
  const filtered = concepts.filter((c) => byFilters(c, query, filters));

  const centerX = 430;
  const centerY = 430;

  filtered.forEach((concept, index) => {
    const angle = (index / Math.max(filtered.length, 1)) * Math.PI * 2;
    const ring = index % 4;
    const radius = 180 + ring * 52;
    const conceptId = `concept:${concept.id}`;
    collect.addNode(
      makeNode(conceptId, concept.name, "concept", centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, {
        chapter: concept.chapter,
        topic: concept.topic,
        parentConcept: concept.parentConcept,
        grade: concept.grade,
        description: concept.description,
      }),
    );
  });

  if (selectedNodeId?.startsWith("concept:")) {
    const selected = filtered.find((c) => `concept:${c.id}` === selectedNodeId);
    if (selected) {
      const topicId = `lineage:topic:${selected.topic}`;
      const chapterId = `lineage:chapter:${selected.chapter}`;
      const parentId = `lineage:parent:${selected.parentConcept}`;

      collect.addNode(makeNode(topicId, selected.topic, "topic", 940, 300));
      collect.addNode(makeNode(chapterId, selected.chapter, "chapter", 940, 390));
      collect.addNode(makeNode(parentId, selected.parentConcept, "parent", 940, 480));

      collect.addEdge(selectedNodeId, topicId);
      collect.addEdge(selectedNodeId, chapterId);
      collect.addEdge(selectedNodeId, parentId);
    }
  }

  return collect.toGraph("No concepts found for selected filters.");
}
