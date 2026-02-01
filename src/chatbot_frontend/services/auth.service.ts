import { apiClient, setAuthToken, removeAuthToken } from '@/lib/api-client';
import type {
  LoginRequest,
  LoginResponse,
  Customer,
  LogoutResponse,
} from '@/types/api';

export interface LoginWithProfileResponse extends LoginResponse {
  customer: Customer;
}

export const authService = {
  /**
   * Login customer with email and password, then fetch profile
   */
  async login(credentials: LoginRequest): Promise<LoginWithProfileResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/customer/auth/login',
      credentials
    );

    // Store the token
    setAuthToken(response.access_token);

    // Store session info
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_id', response.session_id);
      localStorage.setItem('token_expires_at', response.expires_at);
    }

    // Fetch the customer profile
    const customer = await this.getProfile();

    return {
      ...response,
      customer,
    };
  },

  /**
   * Get current customer profile
   */
  async getProfile(): Promise<Customer> {
    return apiClient.get<Customer>('/customer/auth/me');
  },

  /**
   * Logout current customer
   */
  async logout(): Promise<LogoutResponse> {
    try {
      const response = await apiClient.post<LogoutResponse>(
        '/customer/auth/logout'
      );
      return response;
    } finally {
      // Clear all localStorage except theme preference
      this.clearStorageOnLogout();
    }
  },

  /**
   * Clear all localStorage items except theme preference
   */
  clearStorageOnLogout(): void {
    if (typeof window === 'undefined') return;

    const keysToKeep = ['ecommerce-theme'];
    const keysToRemove: string[] = [];

    // Collect keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key)) {
        keysToRemove.push(key);
      }
    }

    // Remove collected keys
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  },

  /**
   * Register new customer, then fetch profile
   */
  async register(data: {
    customer_name: string;
    email: string;
    password: string;
  }): Promise<LoginWithProfileResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/customer/auth/register',
      data
    );

    // Store the token
    setAuthToken(response.access_token);

    // Store session info
    if (typeof window !== 'undefined') {
      localStorage.setItem('session_id', response.session_id);
      localStorage.setItem('token_expires_at', response.expires_at);
    }

    // Fetch the customer profile
    const customer = await this.getProfile();

    return {
      ...response,
      customer,
    };
  },

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;

    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;

    return new Date(expiresAt) < new Date();
  },
};
