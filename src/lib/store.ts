// @ts-nocheck
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TabId =
  | "dashboard" | "architecture" | "models" | "experiments" | "recommend"
  | "datasets" | "export" | "api-docs" | "training" | "evaluation"
  | "analytics" | "workspace" | "contact" | "guide" | "settings";

export type DatasetId = "ml-1m" | "amazon-book";
export type ModelId = "mf" | "lightgcn" | "sasrec" | "din";

interface CoLLMState {
  activeTab: TabId;
  sidebarOpen: boolean;
  selectedDataset: DatasetId;
  selectedModel: ModelId;
  setActiveTab: (tab: TabId) => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedDataset: (ds: DatasetId) => void;
  setSelectedModel: (m: ModelId) => void;
}

export const useStore = create<CoLLMState>()(
  persist(
    (set) => ({
      activeTab: "dashboard",
      sidebarOpen: true,
      selectedDataset: "ml-1m",
      selectedModel: "lightgcn",
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSelectedDataset: (ds) => set({ selectedDataset: ds }),
      setSelectedModel: (m) => set({ selectedModel: m }),
    }),
    { name: "collm-store" }
  )
);
