import type { Edge, Node } from "reactflow";

export const topologicalSort = (
  nodes: Node[],
  edges: Edge[]
) => {
  const sorted: Node[] = [];
  const visited = new Set<string>();

  const visit = (id: string) => {
    if (visited.has(id)) return;
    visited.add(id);

    edges
      .filter((e) => e.source === id)
      .forEach((e) => visit(e.target));

    const node = nodes.find((n) => n.id === id);
    if (node) sorted.push(node);
  };

  nodes.forEach((n) => visit(n.id));

  return sorted.reverse();
};