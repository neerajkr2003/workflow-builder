import { v4 as uuidv4 } from "uuid";
import { useWorkflowStore } from "../../store/workflowStore";

const NodeSidebar = () => {
  const { addNode } = useWorkflowStore();

  const createNode = (type: string) => {
    addNode({
      id: uuidv4(),
      type: "default",
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      data: { label: `${type} Node` },
    });
  };

  return (
    <div>
      <h2 className="font-bold mb-4">
        Node Library
      </h2>

      <button
        onClick={() => createNode("Trigger")}
        className="w-full p-2 bg-blue-500 text-white rounded mb-2"
      >
        Trigger Node
      </button>

      <button
        onClick={() => createNode("Action")}
        className="w-full p-2 bg-green-500 text-white rounded"
      >
        Action Node
      </button>
    </div>
  );
};

export default NodeSidebar;