import { apiClient } from '@/lib/api-client';
import type {
  Order,
  OrderFilters,
  PaginatedData,
  ListData,
  Voucher,
  ApplyVoucherRequest,
  ApplyVoucherResponse,
  RemoveVoucherResponse,
  CheckoutRequest,
  CheckoutResponse,
  CustomerAddress,
} from '@/types/api';

export const orderService = {
  /**
   * Get customer's order history
   */
  async getOrders(filters?: OrderFilters): Promise<PaginatedData<Order>> {
    return apiClient.get<PaginatedData<Order>>('/orders', filters as Record<string, unknown> | undefined);
  },

  /**
   * Get a specific order by ID
   */
  async getOrderById(orderId: number): Promise<Order> {
    return apiClient.get<Order>(`/orders/${orderId}`);
  },

  /**
   * Process checkout - convert cart to order
   */
  async checkout(request: CheckoutRequest): Promise<CheckoutResponse> {
    return apiClient.post<CheckoutResponse>('/orders/checkout', request);
  },
};

export const voucherService = {
  /**
   * Get all active vouchers
   */
  async getActiveVouchers(): Promise<ListData<Voucher>> {
    return apiClient.get<ListData<Voucher>>('/orders/vouchers');
  },

  /**
   * Apply a voucher to the cart
   */
  async applyVoucher(voucherCode: string): Promise<ApplyVoucherResponse> {
    const request: ApplyVoucherRequest = { voucher_code: voucherCode };
    return apiClient.post<ApplyVoucherResponse>(
      '/orders/cart/voucher',
      request
    );
  },

  /**
   * Remove the applied voucher from the cart
   */
  async removeVoucher(): Promise<RemoveVoucherResponse> {
    return apiClient.delete<RemoveVoucherResponse>('/orders/cart/voucher');
  },
};

export const addressService = {
  /**
   * Get all saved addresses for the customer
   */
  async getAddresses(): Promise<ListData<CustomerAddress>> {
    return apiClient.get<ListData<CustomerAddress>>('/addresses');
  },

  /**
   * Get a specific address by ID
   */
  async getAddressById(addressId: string): Promise<CustomerAddress> {
    return apiClient.get<CustomerAddress>(`/addresses/${addressId}`);
  },
};
