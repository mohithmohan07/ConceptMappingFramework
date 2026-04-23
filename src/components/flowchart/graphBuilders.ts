import type { FlowFilters, GraphModel, GraphNode, NormalizedConcept } from "./types";

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

function node(
  id: string,
  label: string,
  kind: GraphNode["kind"],
  x: number,
  y: number,
  meta?: GraphNode["meta"],
): GraphNode {
  return { id, label, kind, x, y, meta, tooltip: label };
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function buildCollector() {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, { id: string; source: string; target: string }>();

  return {
    addNode(next: GraphNode) {
      if (!nodeMap.has(next.id)) nodeMap.set(next.id, next);
    },
    addEdge(source: string, target: string) {
      const id = `${source}->${target}`;
      if (!edgeMap.has(id)) edgeMap.set(id, { id, source, target });
    },
    toGraph(): GraphModel {
      return { nodes: Array.from(nodeMap.values()), edges: Array.from(edgeMap.values()) };
    },
  };
}

export function buildFocusGapsGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const collect = buildCollector();

  const chapterGap = 280;
  const laneX = { chapter: 80, topic: 380, parent: 680, concept: 980 };

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterY = 90 + chapterIndex * chapterGap;
    const chapterId = `chapter:${chapter}`;
    collect.addNode(node(chapterId, chapter, "chapter", laneX.chapter, chapterY));

    const chapterConcepts = filtered.filter((c) => c.chapter === chapter);
    const topics = uniqueSorted(chapterConcepts.map((c) => c.topic));

    topics.forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const topicY = chapterY - 20 + topicIndex * 74;
      collect.addNode(node(topicId, topic, "topic", laneX.topic, topicY));
      collect.addEdge(chapterId, topicId);

      const topicConcepts = chapterConcepts.filter((c) => c.topic === topic);
      uniqueSorted(topicConcepts.map((c) => c.parentConcept)).forEach((parent, parentIndex) => {
        const parentId = `parent:${chapter}:${topic}:${parent}`;
        const parentY = topicY + parentIndex * 58;
        collect.addNode(node(parentId, parent, "parent", laneX.parent, parentY));
        collect.addEdge(topicId, parentId);

        topicConcepts
          .filter((c) => c.parentConcept === parent)
          .forEach((concept, conceptIndex) => {
            const conceptId = `concept:${concept.id}`;
            const conceptY = parentY + conceptIndex * 46;
            collect.addNode(
              node(conceptId, concept.name, "concept", laneX.concept, conceptY, {
                gapScore: concept.gapScore,
                coverage: concept.coverage,
                priority: concept.priority,
                chapter: concept.chapter,
                topic: concept.topic,
                parentConcept: concept.parentConcept,
                grade: concept.grade,
              }),
            );
            collect.addEdge(parentId, conceptId);
          });
      });
    });
  });

  return collect.toGraph();
}

export function buildLibraryGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const collect = buildCollector();
  const laneX = { parent: 120, concept: 460 };

  uniqueSorted(filtered.map((c) => c.parentConcept)).forEach((parent, parentIndex) => {
    const parentId = `parent:${parent}`;
    const parentY = 90 + parentIndex * 188;
    collect.addNode(node(parentId, parent, "parent", laneX.parent, parentY));

    filtered
      .filter((c) => c.parentConcept === parent)
      .forEach((concept, idx) => {
        const conceptId = `concept:${concept.id}`;
        const col = idx % 3;
        const row = Math.floor(idx / 3);
        collect.addNode(
          node(conceptId, concept.name, "concept", laneX.concept + col * 250, parentY - 20 + row * 60, {
            chapter: concept.chapter,
            topic: concept.topic,
            grade: concept.grade,
            description: concept.description,
          }),
        );
        collect.addEdge(parentId, conceptId);
      });
  });

  return collect.toGraph();
}

export function buildCurriculumGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const collect = buildCollector();

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    const chapterY = 100 + chapterIndex * 160;
    collect.addNode(node(chapterId, chapter, "chapter", 120, chapterY));

    uniqueSorted(filtered.filter((c) => c.chapter === chapter).map((c) => c.topic)).forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const col = topicIndex % 4;
      const row = Math.floor(topicIndex / 4);
      collect.addNode(node(topicId, topic, "topic", 460 + col * 230, chapterY - 18 + row * 64));
      collect.addEdge(chapterId, topicId);
    });
  });

  return collect.toGraph();
}

export function buildConceptOverviewGraph(
  concepts: NormalizedConcept[],
  query: string,
  filters: FlowFilters,
  selectedNodeId?: string,
): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const collect = buildCollector();
  const centerX = 650;
  const centerY = 380;

  filtered.forEach((concept, idx) => {
    const angle = (idx / Math.max(filtered.length, 1)) * Math.PI * 2;
    const ring = idx % 4;
    const radius = 200 + ring * 56;
    const conceptId = `concept:${concept.id}`;
    collect.addNode(
      node(conceptId, concept.name, "concept", centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, {
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

      collect.addNode(node(topicId, selected.topic, "topic", centerX + 430, centerY - 90));
      collect.addNode(node(chapterId, selected.chapter, "chapter", centerX + 430, centerY));
      collect.addNode(node(parentId, selected.parentConcept, "parent", centerX + 430, centerY + 90));

      collect.addEdge(selectedNodeId, topicId);
      collect.addEdge(selectedNodeId, chapterId);
      collect.addEdge(selectedNodeId, parentId);
    }
  }

  return collect.toGraph();
}
