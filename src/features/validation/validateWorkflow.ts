import type { Node, Edge } from "reactflow";
import { detectCycle } from "./detectCycle";

export const validateWorkflow = (
  nodes: Node[],
  edges: Edge[]
) => {
  const errors: string[] = [];

  const triggerNodes = nodes.filter((n) =>
    n.data.label.includes("Trigger")
  );

  if (triggerNodes.length === 0) {
    errors.push("At least one Trigger node required.");
  }

  if (detectCycle(nodes, edges)) {
    errors.push("Workflow contains cycle.");
  }

  return errors;
};