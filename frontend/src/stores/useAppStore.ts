import { create } from "zustand";
import type { Document, Summary, UploadItem } from "@/lib/types";
import { api } from "@/lib/api";
import { demoDocuments } from "@/lib/demo-data";

interface AppStore {
  backendOnline: boolean;
  checkBackendHealth: () => Promise<void>;

  documents: Document[];
  fetchDocuments: () => Promise<void>;
  addDocument: (doc: Document) => void;
  removeDocument: (id: string) => void;

  summaries: Summary[];
  activeSummary: Summary | null;
  fetchSummaries: () => Promise<void>;
  setActiveSummary: (s: Summary | null) => void;
  addSummary: (s: Summary) => void;
  updateSummary: (id: string, update: Partial<Summary>) => void;
  removeSummary: (id: string) => void;

  uploadQueue: UploadItem[];
  addToQueue: (item: UploadItem) => void;
  updateQueueItem: (id: string, update: Partial<UploadItem>) => void;
  clearQueue: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  backendOnline: false,
  checkBackendHealth: async () => {
    try {
      await api.health();
      set({ backendOnline: true });
    } catch {
      set({ backendOnline: false });
    }
  },

  documents: [],
  fetchDocuments: async () => {
    try {
      const res = await api.getDocuments();
      set({ documents: res.documents });
    } catch {
      if (get().documents.length === 0) set({ documents: demoDocuments });
    }
  },
  addDocument: (doc) => set((s) => ({ documents: [doc, ...s.documents] })),
  removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.document_id !== id) })),

  summaries: [],
  activeSummary: null,
  fetchSummaries: async () => {
    try {
      const res = await api.getSummaries();
      set({ summaries: res.summaries });
    } catch {
      set({ summaries: [] });
    }
  },
  setActiveSummary: (s) => set({ activeSummary: s }),
  addSummary: (s) => set((st) => ({ summaries: [s, ...st.summaries] })),
  updateSummary: (id, update) =>
    set((s) => ({
      summaries: s.summaries.map((x) => (x.summary_id === id ? { ...x, ...update } : x)),
      activeSummary: s.activeSummary?.summary_id === id ? { ...s.activeSummary, ...update } : s.activeSummary,
    })),
  removeSummary: (id) =>
    set((s) => ({
      summaries: s.summaries.filter((x) => x.summary_id !== id),
      activeSummary: s.activeSummary?.summary_id === id ? null : s.activeSummary,
    })),

  uploadQueue: [],
  addToQueue: (item) => set((s) => ({ uploadQueue: [...s.uploadQueue, item] })),
  updateQueueItem: (id, update) =>
    set((s) => ({ uploadQueue: s.uploadQueue.map((x) => (x.id === id ? { ...x, ...update } : x)) })),
  clearQueue: () => set({ uploadQueue: [] }),
}));
