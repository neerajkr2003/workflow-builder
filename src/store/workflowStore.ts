import { create } from "zustand";
import type { Edge, Node } from "reactflow";
import type { WorkflowState } from "../types/workflow";

interface StoreState {
  past: WorkflowState[];
  present: WorkflowState;
  future: WorkflowState[];

  isExecuting: boolean;
  activeNodeId: string | null;
  logs: string[];

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  addNode: (node: Node) => void;
  deleteNode: (id: string) => void;

  undo: () => void;
  redo: () => void;

  startExecution: () => void;
  stopExecution: () => void;
  setActiveNode: (id: string | null) => void;
  addLog: (msg: string) => void;
  clearLogs: () => void;
}

export const useWorkflowStore = create<StoreState>((set, get) => {
  const saved = localStorage.getItem("workflow");

  const initial: WorkflowState = saved
    ? JSON.parse(saved)
    : { nodes: [], edges: [] };

  const saveToStorage = (state: WorkflowState) => {
    localStorage.setItem("workflow", JSON.stringify(state));
  };

  return {
    past: [],
    present: initial,
    future: [],

    isExecuting: false,
    activeNodeId: null,
    logs: [],

    setNodes: (nodes) => {
      const { past, present } = get();
      const newState = { ...present, nodes };
      saveToStorage(newState);

      set({
        past: [...past, present],
        present: newState,
        future: [],
      });
    },

    setEdges: (edges) => {
      const { past, present } = get();
      const newState = { ...present, edges };
      saveToStorage(newState);

      set({
        past: [...past, present],
        present: newState,
        future: [],
      });
    },

    addNode: (node) => {
      const { past, present } = get();
      const newState = {
        ...present,
        nodes: [...present.nodes, node],
      };
      saveToStorage(newState);

      set({
        past: [...past, present],
        present: newState,
        future: [],
      });
    },

    deleteNode: (id) => {
      const { past, present } = get();
      const newState = {
        nodes: present.nodes.filter((n) => n.id !== id),
        edges: present.edges.filter(
          (e) => e.source !== id && e.target !== id
        ),
      };
      saveToStorage(newState);

      set({
        past: [...past, present],
        present: newState,
        future: [],
      });
    },

    undo: () => {
      const { past, present, future } = get();
      if (!past.length) return;

      const previous = past[past.length - 1];

      set({
        past: past.slice(0, -1),
        present: previous,
        future: [present, ...future],
      });
    },

    redo: () => {
      const { past, present, future } = get();
      if (!future.length) return;

      const next = future[0];

      set({
        past: [...past, present],
        present: next,
        future: future.slice(1),
      });
    },

    startExecution: () => set({ isExecuting: true }),
    stopExecution: () =>
      set({ isExecuting: false, activeNodeId: null }),

    setActiveNode: (id) => set({ activeNodeId: id }),

    addLog: (msg) =>
      set((state) => ({ logs: [...state.logs, msg] })),

    clearLogs: () => set({ logs: [] }),
  };
});