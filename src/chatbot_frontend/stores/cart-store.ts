import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cart } from '@/types/api';

interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
}

interface CartStore extends CartState {
  setCart: (cart: Cart | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateItemCount: (count: number) => void;
  reset: () => void;
}

const initialState: CartState = {
  cart: null,
  isLoading: false,
  error: null,
  itemCount: 0,
};

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      ...initialState,

      setCart: (cart) =>
        set({
          cart,
          itemCount: cart?.num_of_item ?? 0,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      updateItemCount: (count) => set({ itemCount: count }),
      reset: () => set(initialState),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        itemCount: state.itemCount,
      }),
    }
  )
);
