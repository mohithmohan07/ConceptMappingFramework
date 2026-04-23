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

function node(id: string, label: string, kind: GraphNode["kind"], x: number, y: number, meta?: GraphNode["meta"]): GraphNode {
  return { id, label, kind, x, y, meta, tooltip: label };
}

export function buildFocusGapsGraph(concepts: NormalizedConcept[], query: string, filters: FlowFilters): GraphModel {
  const filtered = concepts.filter((c) => byFilters(c, query, filters));
  const nodes: GraphNode[] = [];
  const edges: GraphModel["edges"] = [];
  const nodeIds = new Set<string>();

  const chapters = Array.from(new Set(filtered.map((c) => c.chapter))).sort((a, b) => a.localeCompare(b));
  chapters.forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    nodes.push(node(chapterId, chapter, "chapter", 40, 80 + chapterIndex * 240));
    nodeIds.add(chapterId);

    const chapterConcepts = filtered.filter((c) => c.chapter === chapter);
    const topics = Array.from(new Set(chapterConcepts.map((c) => c.topic))).sort((a, b) => a.localeCompare(b));

    topics.forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      const topY = 40 + chapterIndex * 240 + topicIndex * 80;
      nodes.push(node(topicId, topic, "topic", 320, topY));
      nodeIds.add(topicId);
      edges.push({ id: `${chapterId}->${topicId}`, source: chapterId, target: topicId });

      const topicConcepts = chapterConcepts.filter((c) => c.topic === topic);
      const parents = Array.from(new Set(topicConcepts.map((c) => c.parentConcept))).sort((a, b) => a.localeCompare(b));

      parents.forEach((parent, parentIndex) => {
        const parentId = `parent:${chapter}:${topic}:${parent}`;
        const parentY = topY + parentIndex * 60;
        if (!nodeIds.has(parentId)) {
          nodes.push(node(parentId, parent, "parent", 600, parentY));
          nodeIds.add(parentId);
        }
        edges.push({ id: `${topicId}->${parentId}`, source: topicId, target: parentId });

        topicConcepts
          .filter((c) => c.parentConcept === parent)
          .forEach((concept, conceptIndex) => {
            const conceptId = `concept:${concept.id}`;
            if (!nodeIds.has(conceptId)) {
              nodes.push(
                node(conceptId, concept.name, "concept", 860, parentY + conceptIndex * 48, {
                  gapScore: concept.gapScore,
                  coverage: concept.coverage,
                  priority: concept.priority,
                  chapter: concept.chapter,
                  topic: concept.topic,
                  parentConcept: concept.parentConcept,
                }),
              );
              nodeIds.add(conceptId);
            }
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

  const parents = Array.from(new Set(filtered.map((c) => c.parentConcept))).sort((a, b) => a.localeCompare(b));

  parents.forEach((parent, parentIndex) => {
    const parentId = `parent:${parent}`;
    nodes.push(node(parentId, parent, "parent", 60, 80 + parentIndex * 180));

    const conceptsForParent = filtered.filter((c) => c.parentConcept === parent);
    conceptsForParent.forEach((concept, idx) => {
      const conceptId = `concept:${concept.id}`;
      nodes.push(
        node(conceptId, concept.name, "concept", 420 + (idx % 3) * 230, 40 + parentIndex * 180 + Math.floor(idx / 3) * 64, {
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
  const chapters = Array.from(new Set(filtered.map((c) => c.chapter))).sort((a, b) => a.localeCompare(b));

  chapters.forEach((chapter, chapterIndex) => {
    const chapterId = `chapter:${chapter}`;
    nodes.push(node(chapterId, chapter, "chapter", 100, 80 + chapterIndex * 170));
    const topics = Array.from(new Set(filtered.filter((c) => c.chapter === chapter).map((c) => c.topic))).sort((a, b) =>
      a.localeCompare(b),
    );
    topics.forEach((topic, topicIndex) => {
      const topicId = `topic:${chapter}:${topic}`;
      nodes.push(node(topicId, topic, "topic", 480 + (topicIndex % 3) * 220, 40 + chapterIndex * 170 + Math.floor(topicIndex / 3) * 70));
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
  const centerX = 540;
  const centerY = 360;

  filtered.forEach((concept, idx) => {
    const angle = (idx / Math.max(filtered.length, 1)) * Math.PI * 2;
    const radius = 180 + (idx % 4) * 45;
    const conceptId = `concept:${concept.id}`;
    nodes.push(node(conceptId, concept.name, "concept", centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius, {
      chapter: concept.chapter,
      topic: concept.topic,
      parentConcept: concept.parentConcept,
      grade: concept.grade,
      description: concept.description,
    }));
  });

  if (selectedNodeId?.startsWith("concept:")) {
    const selected = filtered.find((c) => `concept:${c.id}` === selectedNodeId);
    if (selected) {
      const topicId = `lineage:topic:${selected.topic}`;
      const chapterId = `lineage:chapter:${selected.chapter}`;
      const parentId = `lineage:parent:${selected.parentConcept}`;

      nodes.push(node(topicId, selected.topic, "topic", centerX + 340, centerY - 110));
      nodes.push(node(chapterId, selected.chapter, "chapter", centerX + 340, centerY));
      nodes.push(node(parentId, selected.parentConcept, "parent", centerX + 340, centerY + 110));

      edges.push({ id: `${selectedNodeId}->${topicId}`, source: selectedNodeId, target: topicId });
      edges.push({ id: `${selectedNodeId}->${chapterId}`, source: selectedNodeId, target: chapterId });
      edges.push({ id: `${selectedNodeId}->${parentId}`, source: selectedNodeId, target: parentId });
    }
  }

  return { nodes, edges };
}
