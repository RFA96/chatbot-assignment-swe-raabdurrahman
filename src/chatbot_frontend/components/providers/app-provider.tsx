'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { cartService } from '@/services/cart.service';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const { updateItemCount, reset: resetCart } = useCartStore();
  const hasFetched = useRef(false);

  useEffect(() => {
    const syncCartCount = async () => {
      if (isAuthenticated && !hasFetched.current) {
        hasFetched.current = true;
        try {
          const result = await cartService.getCartCount();
          updateItemCount(result.count);
        } catch (error) {
          console.error('Failed to fetch cart count:', error);
        }
      }
    };

    syncCartCount();
  }, [isAuthenticated, updateItemCount]);

  // Reset cart when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      hasFetched.current = false;
      resetCart();
    }
  }, [isAuthenticated, resetCart]);

  return <>{children}</>;
}
