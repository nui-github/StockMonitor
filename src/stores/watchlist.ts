import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WatchlistState {
  symbols: string[];
  add: (symbol: string) => void;
  remove: (symbol: string) => void;
  reorder: (symbols: string[]) => void;
}

// เก็บ localStorage ก่อน (guest) — merge เข้า DB ตอน login ใน Phase 4 (docs/09)
export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set) => ({
      symbols: [],
      add: (symbol) =>
        set((state) => {
          const upper = symbol.toUpperCase();
          if (state.symbols.includes(upper)) return state;
          return { symbols: [...state.symbols, upper] };
        }),
      remove: (symbol) =>
        set((state) => ({ symbols: state.symbols.filter((s) => s !== symbol.toUpperCase()) })),
      reorder: (symbols) => set({ symbols }),
    }),
    { name: "stockmonitor:watchlist" },
  ),
);
