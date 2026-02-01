import { apiClient } from '@/lib/api-client';
import type {
  Product,
  ProductWithCategory,
  ProductCategory,
  ProductFilters,
  PaginatedData,
  ListData,
  BrandsResponse,
  DepartmentsResponse,
} from '@/types/api';

export const productService = {
  /**
   * Get paginated list of products with optional filters
   */
  async getProducts(
    filters?: ProductFilters
  ): Promise<PaginatedData<Product>> {
    return apiClient.get<PaginatedData<Product>>('/products', filters as Record<string, unknown> | undefined);
  },

  /**
   * Get a single product by ID with category details
   */
  async getProductById(productId: number): Promise<ProductWithCategory> {
    return apiClient.get<ProductWithCategory>(`/products/${productId}`);
  },

  /**
   * Get all unique product brands
   */
  async getBrands(): Promise<BrandsResponse> {
    return apiClient.get<BrandsResponse>('/products/brands');
  },

  /**
   * Get all departments (Men/Women)
   */
  async getDepartments(): Promise<DepartmentsResponse> {
    return apiClient.get<DepartmentsResponse>('/products/departments');
  },

  /**
   * Search products by name
   */
  async searchProducts(
    query: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedData<Product>> {
    return apiClient.get<PaginatedData<Product>>('/products', {
      search: query,
      page,
      page_size: pageSize,
    });
  },
};

export const categoryService = {
  /**
   * Get all product categories
   */
  async getCategories(): Promise<ListData<ProductCategory>> {
    return apiClient.get<ListData<ProductCategory>>('/categories');
  },

  /**
   * Get a single category by ID
   */
  async getCategoryById(categoryId: string): Promise<ProductCategory> {
    return apiClient.get<ProductCategory>(`/categories/${categoryId}`);
  },

  /**
   * Get products in a specific category
   */
  async getProductsByCategory(
    categoryId: string,
    page = 1,
    pageSize = 10
  ): Promise<PaginatedData<Product>> {
    return apiClient.get<PaginatedData<Product>>(
      `/categories/${categoryId}/products`,
      { page, page_size: pageSize }
    );
  },
};
