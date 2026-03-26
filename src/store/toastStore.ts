import { create } from 'zustand';

interface ToastState {
  message: string | null;
  type: 'error' | 'info';
  show: (message: string, type?: 'error' | 'info') => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: 'error',
  show: (message, type = 'error') => set({ message, type }),
  hide: () => set({ message: null }),
}));
