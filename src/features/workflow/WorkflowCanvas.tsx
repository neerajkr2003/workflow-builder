import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";

import type {
  Connection,
  NodeChange,
  EdgeChange,
} from "reactflow";

import "reactflow/dist/style.css";
import { useWorkflowStore } from "../../store/workflowStore";

const WorkflowCanvas = () => {
  const {
    present,
    setNodes,
    setEdges,
    deleteNode,
    activeNodeId,
  } = useWorkflowStore();

  return (
    <ReactFlow
      nodes={present.nodes.map((node) => ({
        ...node,
        style:
          node.id === activeNodeId
            ? { border: "3px solid red" }
            : {},
      }))}
      edges={present.edges}
      onNodesChange={(changes: NodeChange[]) => {
        const updated = applyNodeChanges(
          changes,
          present.nodes
        );
        setNodes(updated);
      }}
      onEdgesChange={(changes: EdgeChange[]) => {
        const updated = applyEdgeChanges(
          changes,
          present.edges
        );
        setEdges(updated);
      }}
      onConnect={(connection: Connection) => {
        if (!connection.source || !connection.target) return;
        if (connection.source === connection.target) return;

        const newEdge = addEdge(
          connection,
          present.edges
        );
        setEdges(newEdge);
      }}
      onNodesDelete={(nodes) => {
        nodes.forEach((n) => deleteNode(n.id));
      }}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};

export default WorkflowCanvas;