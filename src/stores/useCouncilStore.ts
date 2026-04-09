import { create } from 'zustand';

interface CouncilState {
  selectedHQ: string | null;
  alias: string;
  setHQ: (hq: string) => void;
  clear: () => void;
}

export const useCouncilStore = create<CouncilState>((set) => ({
  selectedHQ: null,
  alias: '',

  setHQ: (hq: string) => {
    set({
      selectedHQ: hq,
      alias: `${hq}_COUNCIL`
    });
  },

  clear: () => {
    set({ selectedHQ: null, alias: '' });
  }
}));
