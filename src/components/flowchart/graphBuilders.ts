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

export function buildFocusGapsGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const nodes: GraphNode[] = [];
  const edges: GraphModel["edges"] = [];

  const chapterGap = 320;
  const laneX = { chapter: 80, topic: 420, parent: 760, concept: 1100 };

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterY = 80 + chapterIndex * chapterGap;
    const chapterId = `chapter:${chapter}`;
    nodes.push(node(chapterId, chapter, "chapter", laneX.chapter, chapterY));

    const chapterConcepts = filtered.filter((c) => c.chapter === chapter);
    const topics = uniqueSorted(chapterConcepts.map((c) => c.topic));

    topics.forEach((topic, topicIndex) => {
      const topicY = chapterY - 30 + topicIndex * 88;
      const topicId = `topic:${chapter}:${topic}`;
      nodes.push(node(topicId, topic, "topic", laneX.topic, topicY));
      edges.push({ id: `${chapterId}->${topicId}`, source: chapterId, target: topicId });

      const topicConcepts = chapterConcepts.filter((c) => c.topic === topic);
      const parents = uniqueSorted(topicConcepts.map((c) => c.parentConcept));

      parents.forEach((parent, parentIndex) => {
        const parentY = topicY + parentIndex * 70;
        const parentId = `parent:${chapter}:${topic}:${parent}`;
        nodes.push(node(parentId, parent, "parent", laneX.parent, parentY));
        edges.push({ id: `${topicId}->${parentId}`, source: topicId, target: parentId });

        topicConcepts
          .filter((c) => c.parentConcept === parent)
          .forEach((concept, conceptIndex) => {
            const conceptId = `concept:${concept.id}`;
            const conceptY = parentY + conceptIndex * 56;
            nodes.push(
              node(conceptId, concept.name, "concept", laneX.concept, conceptY, {
                gapScore: concept.gapScore,
                coverage: concept.coverage,
                priority: concept.priority,
                chapter: concept.chapter,
                topic: concept.topic,
                parentConcept: concept.parentConcept,
              }),
            );
            edges.push({ id: `${parentId}->${conceptId}`, source: parentId, target: conceptId });
          });
      });
    });
  });

  return { nodes, edges };
}

export function buildLibraryGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const nodes: GraphNode[] = [];
  const edges: GraphModel["edges"] = [];

  const laneX = { parent: 100, conceptStart: 460 };
  uniqueSorted(filtered.map((c) => c.parentConcept)).forEach((parent, parentIndex) => {
    const parentY = 90 + parentIndex * 210;
    const parentId = `parent:${parent}`;
    nodes.push(node(parentId, parent, "parent", laneX.parent, parentY));

    const conceptsForParent = filtered.filter((c) => c.parentConcept === parent);
    conceptsForParent.forEach((concept, idx) => {
      const conceptId = `concept:${concept.id}`;
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      nodes.push(
        node(conceptId, concept.name, "concept", laneX.conceptStart + col * 220, parentY - 24 + row * 62, {
          chapter: concept.chapter,
          topic: concept.topic,
          grade: concept.grade,
        }),
      );
      edges.push({ id: `${parentId}->${conceptId}`, source: parentId, target: conceptId });
    });
  });

  return { nodes, edges };
}

export function buildCurriculumGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const nodes: GraphNode[] = [];
  const edges: GraphModel["edges"] = [];

  uniqueSorted(filtered.map((c) => c.chapter)).forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    const y = 90 + chapterIndex * 170;
    nodes.push(node(chapterId, chapter, "chapter", 120, y));

    const topics = uniqueSorted(filtered.filter((c) => c.chapter === chapter).map((c) => c.topic));
    topics.forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const col = topicIndex % 4;
      const row = Math.floor(topicIndex / 4);
      nodes.push(node(topicId, topic, "topic", 500 + col * 230, y - 20 + row * 70));
      edges.push({ id: `${chapterId}->${topicId}`, source: chapterId, target: topicId });
    });
  });

  return { nodes, edges };
}

export function buildConceptOverviewGraph(
  concepts: NormalizedConcept[],
  query: string,
  filters: FlowFilters,
  selectedNodeId?: string,
): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const nodes: GraphNode[] = [];
  const edges: GraphModel["edges"] = [];
  const centerX = 700;
  const centerY = 420;

  filtered.forEach((concept, idx) => {
    const angle = (idx / Math.max(filtered.length, 1)) * Math.PI * 2;
    const ring = idx % 5;
    const radius = 200 + ring * 45;
    const conceptId = `concept:${concept.id}`;
    nodes.push(
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

      nodes.push(node(topicId, selected.topic, "topic", centerX + 420, centerY - 120));
      nodes.push(node(chapterId, selected.chapter, "chapter", centerX + 420, centerY));
      nodes.push(node(parentId, selected.parentConcept, "parent", centerX + 420, centerY + 120));

      edges.push({ id: `${selectedNodeId}->${topicId}`, source: selectedNodeId, target: topicId });
      edges.push({ id: `${selectedNodeId}->${chapterId}`, source: selectedNodeId, target: chapterId });
      edges.push({ id: `${selectedNodeId}->${parentId}`, source: selectedNodeId, target: parentId });
    }
  }

  return { nodes, edges };
}
