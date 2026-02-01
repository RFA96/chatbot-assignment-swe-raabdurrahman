import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types/api';

interface AuthState {
  customer: Customer | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  expiresAt: string | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
}

interface AuthStore extends AuthState {
  setCustomer: (customer: Customer, sessionId: string, expiresAt: string) => void;
  clearAuth: () => void;
  isSessionValid: () => boolean;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  setAuthModalTab: (tab: 'login' | 'register') => void;
}

const initialState: AuthState = {
  customer: null,
  isAuthenticated: false,
  sessionId: null,
  expiresAt: null,
  isAuthModalOpen: false,
  authModalTab: 'login',
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCustomer: (customer, sessionId, expiresAt) =>
        set({
          customer,
          isAuthenticated: true,
          sessionId,
          expiresAt,
          isAuthModalOpen: false,
        }),

      clearAuth: () => set({
        customer: null,
        isAuthenticated: false,
        sessionId: null,
        expiresAt: null,
      }),

      isSessionValid: () => {
        const { expiresAt } = get();
        if (!expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },

      openAuthModal: (tab = 'login') => set({ isAuthModalOpen: true, authModalTab: tab }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setAuthModalTab: (tab) => set({ authModalTab: tab }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        customer: state.customer,
        sessionId: state.sessionId,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
