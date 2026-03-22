import type { Node, Edge } from "reactflow";

export const detectCycle = (
  nodes: Node[],
  edges: Edge[]
) => {
  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (id: string): boolean => {
    if (stack.has(id)) return true;
    if (visited.has(id)) return false;

    visited.add(id);
    stack.add(id);

    const outgoing = edges.filter((e) => e.source === id);

    for (const edge of outgoing) {
      if (dfs(edge.target)) return true;
    }

    stack.delete(id);
    return false;
  };

  return nodes.some((n) => dfs(n.id));
};