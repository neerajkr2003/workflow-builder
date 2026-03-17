import Layout from "./components/Layout";
import WorkflowCanvas from "./features/workflow/WorkflowCanvas";
import NodeSidebar from "./features/workflow/NodeSidebar";
import ConfigPanel from "./features/workflow/ConfigPanel";

function App() {
  return (
    <Layout
      sidebar={<NodeSidebar />}
      canvas={<WorkflowCanvas />}
      config={<ConfigPanel />}
    />
  );
}

export default App;