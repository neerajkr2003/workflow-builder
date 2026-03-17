import { useWorkflowStore } from "../../store/workflowStore";
import { validateWorkflow } from "../validation/validateWorkflow";
import { topologicalSort } from "../execution/topologicalSort";

const ConfigPanel = () => {
  const {
    present,
    startExecution,
    stopExecution,
    setActiveNode,
    addLog,
    clearLogs,
    logs,
  } = useWorkflowStore();

  const runWorkflow = async () => {
    clearLogs();

    const errors = validateWorkflow(
      present.nodes,
      present.edges
    );

    if (errors.length) {
      errors.forEach((e) => addLog("❌ " + e));
      return;
    }

    startExecution();

    const sorted = topologicalSort(
      present.nodes,
      present.edges
    );

    for (const node of sorted) {
      setActiveNode(node.id);
      addLog("Running: " + node.data.label);
      await new Promise((res) =>
        setTimeout(res, 1000)
      );
    }

    addLog("✅ Execution Completed");
    stopExecution();
  };

  return (
    <div>
      <h2 className="font-bold mb-4">
        Execution
      </h2>

      <button
        onClick={runWorkflow}
        className="w-full p-2 bg-purple-600 text-white rounded mb-4"
      >
        Run Workflow
      </button>

      <div className="h-64 overflow-y-auto border p-2 text-sm bg-gray-100 dark:bg-gray-700">
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default ConfigPanel;