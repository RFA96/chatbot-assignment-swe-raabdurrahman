import { apiClient } from '@/lib/api-client';
import type {
  ProductStock,
  LowStockProduct,
  StockMovement,
  StockMovementFilters,
  AddStockRequest,
  RemoveStockRequest,
  AdjustStockRequest,
  UpdateStockSettingsRequest,
  StockOperationResponse,
  PaginatedData,
  ListData,
} from '@/types/api';

export const stockService = {
  /**
   * Get stock information for a specific product (public endpoint)
   */
  async getProductStock(productId: number): Promise<ProductStock> {
    return apiClient.get<ProductStock>(`/stock/${productId}`);
  },

  /**
   * Get all products with low or zero stock (admin only)
   */
  async getLowStockProducts(): Promise<ListData<LowStockProduct>> {
    return apiClient.get<ListData<LowStockProduct>>('/stock/low-stock');
  },

  /**
   * Get stock movement history for a product (admin only)
   */
  async getStockMovements(
    productId: number,
    filters?: StockMovementFilters
  ): Promise<PaginatedData<StockMovement>> {
    return apiClient.get<PaginatedData<StockMovement>>(
      `/stock/${productId}/movements`,
      filters as Record<string, unknown> | undefined
    );
  },

  /**
   * Add stock to a product (admin only)
   */
  async addStock(
    productId: number,
    request: AddStockRequest
  ): Promise<StockOperationResponse> {
    return apiClient.post<StockOperationResponse>(
      `/stock/${productId}/add`,
      request
    );
  },

  /**
   * Remove stock from a product (admin only)
   */
  async removeStock(
    productId: number,
    request: RemoveStockRequest
  ): Promise<StockOperationResponse> {
    return apiClient.post<StockOperationResponse>(
      `/stock/${productId}/remove`,
      request
    );
  },

  /**
   * Adjust stock to a specific quantity (admin only)
   */
  async adjustStock(
    productId: number,
    request: AdjustStockRequest
  ): Promise<StockOperationResponse> {
    return apiClient.post<StockOperationResponse>(
      `/stock/${productId}/adjust`,
      request
    );
  },

  /**
   * Update stock tracking settings for a product (admin only)
   */
  async updateStockSettings(
    productId: number,
    settings: UpdateStockSettingsRequest
  ): Promise<ProductStock> {
    return apiClient.patch<ProductStock>(
      `/stock/${productId}/settings`,
      settings
    );
  },

  /**
   * Check if a product is in stock (helper method)
   */
  async isInStock(productId: number): Promise<boolean> {
    try {
      const stock = await this.getProductStock(productId);
      return stock.available_quantity > 0;
    } catch {
      return false;
    }
  },

  /**
   * Check if a product has sufficient stock for a given quantity
   */
  async hasSufficientStock(
    productId: number,
    quantity: number
  ): Promise<boolean> {
    try {
      const stock = await this.getProductStock(productId);
      return stock.available_quantity >= quantity;
    } catch {
      return false;
    }
  },
};
