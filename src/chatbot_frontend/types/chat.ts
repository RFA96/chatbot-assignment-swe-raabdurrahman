import { Product, ProductWithCategory, Cart, Order, Voucher, ProductCategory } from './api';

// ============================================
// Chat Message Types
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageContentType =
  | 'text'
  | 'product_card'
  | 'product_list'
  | 'cart_summary'
  | 'order_summary'
  | 'voucher_card'
  | 'category_list'
  | 'quick_replies'
  | 'error';

export interface TextContent {
  type: 'text';
  text: string;
}

export interface ProductCardContent {
  type: 'product_card';
  product: Product | ProductWithCategory;
}

export interface ProductListContent {
  type: 'product_list';
  products: Product[];
  title?: string;
  showAddToCart?: boolean;
}

export interface CartSummaryContent {
  type: 'cart_summary';
  cart: Cart;
}

export interface OrderSummaryContent {
  type: 'order_summary';
  order: Order;
}

export interface VoucherCardContent {
  type: 'voucher_card';
  voucher: Voucher;
}

export interface CategoryListContent {
  type: 'category_list';
  categories: ProductCategory[];
}

export interface QuickRepliesContent {
  type: 'quick_replies';
  options: QuickReplyOption[];
}

export interface ErrorContent {
  type: 'error';
  message: string;
  code?: string;
}

export type MessageContent =
  | TextContent
  | ProductCardContent
  | ProductListContent
  | CartSummaryContent
  | OrderSummaryContent
  | VoucherCardContent
  | CategoryListContent
  | QuickRepliesContent
  | ErrorContent;

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: MessageContent[];
  timestamp: string;
  isLoading?: boolean;
}

// ============================================
// Quick Reply Types
// ============================================

export interface QuickReplyOption {
  id: string;
  label: string;
  action: QuickReplyAction;
  icon?: string;
}

export type QuickReplyAction =
  | { type: 'send_message'; message: string }
  | { type: 'navigate'; path: string }
  | { type: 'add_to_cart'; productId: number }
  | { type: 'view_product'; productId: number }
  | { type: 'apply_voucher'; code: string }
  | { type: 'view_cart' }
  | { type: 'checkout' };

// ============================================
// Chat Context Types (for MCP)
// ============================================

export interface ChatContext {
  conversationId: string;
  messages: ChatMessage[];
  isAuthenticated: boolean;
  customerId?: number;
  customerName?: string;
  cartItemCount: number;
  currentIntent?: ChatIntent;
}

export type ChatIntent =
  | 'browse_products'
  | 'search_product'
  | 'view_cart'
  | 'add_to_cart'
  | 'checkout'
  | 'track_order'
  | 'apply_voucher'
  | 'get_help'
  | 'greeting'
  | 'unknown';

// ============================================
// Chat State Types
// ============================================

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  conversationId: string;
  suggestedReplies: QuickReplyOption[];
}

export type ChatAction =
  | { type: 'ADD_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<ChatMessage> } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUGGESTED_REPLIES'; payload: QuickReplyOption[] }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'RESET' };

// ============================================
// Chat Input Types
// ============================================

export interface ChatInputState {
  value: string;
  isDisabled: boolean;
  placeholder: string;
}
