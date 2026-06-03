import { create } from 'zustand';

interface SocketState {
  isConnected: boolean;
  lastMessage: any | null;
  scans: any[];
  parkingData: Record<string, { current: number, total: number }>;
  lastDiscoveredReaderId: string | null;
  setConnected: (status: boolean) => void;
  addScan: (scan: any) => void;
  updateParking: (parkingData: any) => void;
  setLastDiscoveredReaderId: (readerId: string) => void;
  clearLastDiscoveredReaderId: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  isConnected: false,
  lastMessage: null,
  scans: [],
  parkingData: {},
  lastDiscoveredReaderId: null,

  setConnected: (status) => set({ isConnected: status }),

  addScan: (scan) => set((state) => {
    const existingIndex = state.scans.findIndex((item) => item.id === scan.id);

    if (existingIndex >= 0) {
      const updated = [...state.scans];
      updated[existingIndex] = { ...updated[existingIndex], ...scan };

      // Keep the freshest scan at the top for consumers that read scans[0].
      const [mergedScan] = updated.splice(existingIndex, 1);
      return { scans: [mergedScan, ...updated].slice(0, 50) };
    }

    return {
      scans: [scan, ...state.scans].slice(0, 50),
    };
  }),

  updateParking: (data) => set((state) => ({
    parkingData: {
      ...state.parkingData,
      [data.id]: { current: data.current, total: data.total }
    }
  })),

  setLastDiscoveredReaderId: (readerId) => set({ lastDiscoveredReaderId: readerId }),
  clearLastDiscoveredReaderId: () => set({ lastDiscoveredReaderId: null }),
}));
