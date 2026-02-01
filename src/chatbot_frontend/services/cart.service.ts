import { apiClient } from '@/lib/api-client';
import type {
  Cart,
  AddToCartRequest,
  AddToCartResponse,
  RemoveFromCartResponse,
  ClearCartResponse,
  CartCountResponse,
} from '@/types/api';

export const cartService = {
  /**
   * Get the current customer's shopping cart
   */
  async getCart(): Promise<Cart> {
    return apiClient.get<Cart>('/cart');
  },

  /**
   * Add a product to the cart
   */
  async addToCart(productId: number): Promise<AddToCartResponse> {
    const request: AddToCartRequest = { product_id: productId };
    return apiClient.post<AddToCartResponse>('/cart/items', request);
  },

  /**
   * Remove an item from the cart
   */
  async removeFromCart(orderItemId: string): Promise<RemoveFromCartResponse> {
    return apiClient.delete<RemoveFromCartResponse>(
      `/cart/items/${orderItemId}`
    );
  },

  /**
   * Clear all items from the cart
   */
  async clearCart(): Promise<ClearCartResponse> {
    return apiClient.delete<ClearCartResponse>('/cart');
  },

  /**
   * Get the number of items in the cart
   */
  async getCartCount(): Promise<CartCountResponse> {
    return apiClient.get<CartCountResponse>('/cart/count');
  },
};
