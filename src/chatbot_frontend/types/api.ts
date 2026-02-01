// ============================================
// API Response Wrapper Types
// ============================================

export interface ApiSuccessResponse<T> {
  status: 'success';
  status_code: number;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  status_code: number;
  message: string;
  errors?: Record<string, unknown>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Pagination wrapper for list endpoints
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Simple list wrapper (non-paginated)
export interface ListData<T> {
  items: T[];
  total: number;
}

// ============================================
// Customer & Authentication Types
// ============================================

export interface Customer {
  customer_id: number;
  full_name: string;
  email: string;
  age: number;
  gender: 'M' | 'F';
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: 'bearer';
  expires_at: string;
  session_id: string;
}

export interface LogoutResponse {
  session_id: string;
}

// ============================================
// Product Category Types
// ============================================

export interface ProductCategory {
  product_category_id: string;
  product_category_name: string;
  created_at: string;
}

// ============================================
// Product Types
// ============================================

export type Department = 'Men' | 'Women';

export interface Product {
  product_id: number;
  product_category_id: string;
  product_name: string;
  product_brand: string;
  retail_price: number;
  department: Department;
  created_at: string;
}

export interface ProductWithCategory extends Omit<Product, 'product_category_id'> {
  category: ProductCategory;
}

export interface ProductFilters {
  category_id?: string;
  brand?: string;
  department?: Department;
  min_price?: number;
  max_price?: number;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface BrandsResponse {
  brands: string[];
  total: number;
}

export interface DepartmentsResponse {
  departments: Department[];
  total: number;
}

// ============================================
// Shopping Cart Types
// ============================================

export type OrderStatus =
  | 'Cart'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Complete'
  | 'Cancelled'
  | 'Returned';

export interface CartItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_brand: string;
  retail_price: number;
  department: Department;
}

export interface Cart {
  order_id: number;
  customer_id: number;
  status: 'Cart';
  items: CartItem[];
  num_of_item: number;
  total_price: number;
  created_at: string;
}

export interface AddToCartRequest {
  product_id: number;
}

export interface AddToCartResponse {
  order_item_id: string;
  order_id: number;
  product_id: number;
  message: string;
}

export interface RemoveFromCartResponse {
  order_item_id: string;
  message: string;
}

export interface ClearCartResponse {
  order_id: number;
  items_removed: number;
  message: string;
}

export interface CartCountResponse {
  count: number;
}

// ============================================
// Customer Address Types
// ============================================

export interface CustomerAddress {
  customer_address_id: string;
  customer_id: number;
  customer_address_label: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface ShippingAddressSummary {
  customer_address_id: string;
  customer_address_label: string;
  street_address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// ============================================
// Voucher Types
// ============================================

export type DiscountType = 'percentage' | 'fixed';

export interface Voucher {
  voucher_id: string;
  voucher_code: string;
  voucher_name: string;
  discount_type: DiscountType;
  discount_value: number;
  min_purchase_amount: number;
  max_discount_amount: number | null;
  usage_limit: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
}

export interface VoucherSummary {
  voucher_id: string;
  voucher_code: string;
  voucher_name?: string;
  discount_type?: DiscountType;
  discount_value?: number;
}

export interface ApplyVoucherRequest {
  voucher_code: string;
}

export interface ApplyVoucherResponse {
  voucher: Voucher;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  message: string;
}

export interface RemoveVoucherResponse {
  subtotal: number;
  total_amount: number;
  message: string;
}

// ============================================
// Order Types
// ============================================

export interface OrderItem {
  order_item_id: string;
  product_id: number;
  product_name: string;
  product_brand?: string;
  retail_price: number;
  department?: Department;
}

export interface Order {
  order_id: number;
  customer_id: number;
  status: OrderStatus;
  num_of_item: number;
  subtotal: number;
  discount_amount: number;
  total_amount: number;
  voucher: VoucherSummary | null;
  shipping_address: ShippingAddressSummary | null;
  items: OrderItem[];
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
}

export interface CheckoutRequest {
  shipping_address_id: string;
  voucher_code?: string;
}

export interface CheckoutResponse {
  order: Order;
  message: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  page?: number;
  page_size?: number;
}

// ============================================
// Health Check Types
// ============================================

export interface HealthResponse {
  app_name: string;
  version: string;
}

// ============================================
// Stock Management Types
// ============================================

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export type StockMovementType = 'IN' | 'OUT' | 'RESERVED' | 'RELEASED' | 'ADJUSTMENT';

export type StockReferenceType = 'ORDER' | 'MANUAL' | 'IMPORT' | 'RETURN';

export interface ProductStock {
  product_id: number;
  product_name: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  is_track_stock: boolean;
  stock_status: StockStatus;
}

export interface LowStockProduct {
  product_id: number;
  product_name: string;
  product_brand: string;
  product_category_name: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  low_stock_threshold: number;
  stock_status: StockStatus;
}

export interface StockMovement {
  stock_movement_id: string;
  product_id: number;
  movement_type: StockMovementType;
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: StockReferenceType | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface StockMovementFilters {
  movement_type?: StockMovementType;
  page?: number;
  page_size?: number;
}

export interface AddStockRequest {
  quantity: number;
  notes?: string;
}

export interface RemoveStockRequest {
  quantity: number;
  notes?: string;
}

export interface AdjustStockRequest {
  new_quantity: number;
  notes?: string;
}

export interface UpdateStockSettingsRequest {
  low_stock_threshold?: number;
  is_track_stock?: boolean;
}

export interface StockOperationResponse {
  product_id: number;
  movement_id: string;
  movement_type: StockMovementType | 'ADJUSTMENT';
  quantity_changed: number;
  previous_stock: number;
  current_stock: number;
  message: string;
}

// ============================================
// AI Chatbot Types
// ============================================

export interface ChatProduct {
  product_id: number;
  product_name: string;
  product_brand: string;
  retail_price: number;
  department: Department;
  image_url: string;
}

export interface ChatToolCall {
  tool: string;
  arguments: Record<string, unknown>;
  result: {
    success: boolean;
    data?: unknown;
    error?: string;
  };
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  tool_calls?: ChatToolCall[];
  products?: ChatProduct[];
  token_usage: TokenUsage;
  created_at: string;
}

export interface CreateSessionResponse {
  session_id: string;
  customer_id: number | null;
  created_at: string;
}

export interface ChatSession {
  session_id: string;
  customer_id: number | null;
  created_at: string;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  total: number;
}

export interface ChatHistoryMessage {
  role: 'user' | 'model';
  content: string;
  token_usage: TokenUsage | null;
  created_at: string;
}

export interface SessionHistoryResponse {
  session_id: string;
  customer_id: number | null;
  created_at: string;
  messages: ChatHistoryMessage[];
}

export interface DeleteSessionResponse {
  session_id: string;
}
