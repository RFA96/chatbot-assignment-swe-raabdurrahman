'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { cn, formatDateTime } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { ProductCard } from '@/components/features/product/product-card';
import { CartSummary } from '@/components/features/cart/cart-summary';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonMessage } from '@/components/ui/skeleton';
import { QuickReplies } from './quick-replies';
import { AlertCircle, RefreshCw, ExternalLink, ShoppingCart, Check } from 'lucide-react';
import type { ChatMessage as ChatMessageType, QuickReplyOption } from '@/types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onAddToCart?: (productId: number) => void;
  onViewProduct?: (productId: number) => void;
  onQuickReply?: (option: QuickReplyOption) => void;
  onRetry?: () => void;
  className?: string;
}

export function ChatMessage({
  message,
  onAddToCart,
  onViewProduct,
  onQuickReply,
  onRetry,
  className,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (message.isLoading) {
    return <SkeletonMessage />;
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-fade-in',
        isUser && 'flex-row-reverse',
        className
      )}
    >
      {/* Avatar */}
      {!isSystem && (
        <Avatar
          fallback={isUser ? 'You' : 'AI'}
          size="sm"
          className={cn(
            isUser
              ? 'bg-primary-500 text-white'
              : 'bg-muted'
          )}
        />
      )}

      {/* Message Content */}
      <div
        className={cn(
          'flex flex-col gap-2',
          isUser ? 'items-end' : 'items-start',
          isSystem && 'w-full'
        )}
      >
        {message.content.map((content, index) => (
          <MessageContent
            key={index}
            content={content}
            isUser={isUser}
            onAddToCart={onAddToCart}
            onViewProduct={onViewProduct}
            onQuickReply={onQuickReply}
            onRetry={onRetry}
          />
        ))}

        {/* Timestamp */}
        <span className="text-xs text-muted-foreground">
          {formatDateTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

interface MessageContentProps {
  content: ChatMessageType['content'][0];
  isUser: boolean;
  onAddToCart?: (productId: number) => void;
  onViewProduct?: (productId: number) => void;
  onQuickReply?: (option: QuickReplyOption) => void;
  onRetry?: () => void;
}

// Selectable Product List Component with Checkboxes
interface SelectableProductListProps {
  products: Array<{
    product_id: number;
    product_name: string;
    product_brand: string;
    retail_price: number;
    department: string;
  }>;
  title?: string;
  onAddToCart?: (productId: number) => void;
  onViewProduct?: (productId: number) => void;
  showAddToCart?: boolean;
}

function SelectableProductList({
  products,
  title,
  onAddToCart,
  onViewProduct,
  showAddToCart = true,
}: SelectableProductListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const toggleProduct = (productId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(products.map((p) => p.product_id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAddSelectedToCart = async () => {
    if (!onAddToCart || selectedIds.size === 0) return;

    setIsAddingToCart(true);
    for (const productId of selectedIds) {
      await onAddToCart(productId);
    }
    setIsAddingToCart(false);
    setSelectedIds(new Set());
  };

  const displayProducts = products.slice(0, 5);

  return (
    <div className="space-y-3 max-w-[350px]">
      {title && (
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      )}

      {/* Select All / Deselect All - only show when showAddToCart is true */}
      {showAddToCart && (
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={selectAll}
            className="text-primary-500 hover:underline"
          >
            Select All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={deselectAll}
            className="text-muted-foreground hover:underline"
          >
            Deselect All
          </button>
          {selectedIds.size > 0 && (
            <span className="ml-auto text-muted-foreground">
              {selectedIds.size} selected
            </span>
          )}
        </div>
      )}

      {/* Product List */}
      <div className="flex flex-col gap-2">
        {displayProducts.map((product) => {
          const isSelected = selectedIds.has(product.product_id);
          const imageUrl = `https://picsum.photos/seed/${product.product_id}/100/100`;

          return (
            <div
              key={product.product_id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg border transition-all',
                showAddToCart && 'cursor-pointer',
                showAddToCart && isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                  : 'border-border bg-card',
                showAddToCart && !isSelected && 'hover:bg-accent/50'
              )}
              onClick={showAddToCart ? () => toggleProduct(product.product_id) : undefined}
            >
              {/* Checkbox - only show when showAddToCart is true */}
              {showAddToCart && (
                <div
                  className={cn(
                    'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                    isSelected
                      ? 'bg-primary-500 border-primary-500'
                      : 'border-muted-foreground/50'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" />}
                </div>
              )}

              {/* Product Image */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                <img
                  src={imageUrl}
                  alt={product.product_name}
                  className="object-cover w-full h-full"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {product.product_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.product_brand}
                </p>
              </div>

              {/* Price */}
              <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 shrink-0">
                ${product.retail_price.toFixed(2)}
              </p>
            </div>
          );
        })}

        {products.length > 5 && (
          <p className="text-xs text-muted-foreground text-center py-1">
            +{products.length - 5} more products
          </p>
        )}
      </div>

      {/* Action Buttons - only show when showAddToCart is true */}
      {showAddToCart && (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleAddSelectedToCart}
            disabled={selectedIds.size === 0 || isAddingToCart}
            className="flex-1"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isAddingToCart
              ? 'Adding...'
              : `Add ${selectedIds.size > 0 ? selectedIds.size : ''} to Cart`}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to extract order ID from text
function extractOrderId(text: string): string | null {
  // Remove markdown formatting for easier matching
  const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');

  // Match patterns like "order ID is 124992", "Order ID: 124992", etc.
  const patterns = [
    /order\s*ID[:\s]+(\d+)/i,
    /order\s*(?:number|#)[:\s]+(\d+)/i,
    /order\s*(?:ID|number|#)?\s*(?:is|:)\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function MessageContent({
  content,
  isUser,
  onAddToCart,
  onViewProduct,
  onQuickReply,
  onRetry,
}: MessageContentProps) {
  switch (content.type) {
    case 'text': {
      // Check if this is an order confirmation message
      const orderId = !isUser ? extractOrderId(content.text) : null;
      const isOrderConfirmation = orderId &&
        (content.text.toLowerCase().includes('order has been placed') ||
         content.text.toLowerCase().includes('placed successfully') ||
         content.text.toLowerCase().includes('order confirmed'));

      return (
        <div className="space-y-2">
          <div
            className={cn(
              'message-bubble',
              isUser ? 'message-bubble-user' : 'message-bubble-assistant'
            )}
          >
            <div className="text-sm prose">
              <ReactMarkdown>{content.text}</ReactMarkdown>
            </div>
          </div>

          {/* View Order Button */}
          {isOrderConfirmation && orderId && (
            <Link
              href={`/orders/${orderId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-primary-500 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950"
              >
                <ExternalLink className="h-4 w-4" />
                View Order #{orderId}
              </Button>
            </Link>
          )}
        </div>
      );
    }

    case 'product_card':
      return (
        <ProductCard
          product={content.product}
          variant="chat"
          onAddToCart={onAddToCart}
          onViewDetails={onViewProduct}
        />
      );

    case 'product_list':
      return (
        <SelectableProductList
          products={content.products}
          title={content.title}
          onAddToCart={onAddToCart}
          onViewProduct={onViewProduct}
          showAddToCart={content.showAddToCart !== false}
        />
      );

    case 'cart_summary':
      return <CartSummary cart={content.cart} variant="chat" />;

    case 'voucher_card':
      return (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white max-w-[280px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Voucher</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {content.voucher.discount_type === 'percentage'
                ? `${content.voucher.discount_value}% OFF`
                : `$${content.voucher.discount_value} OFF`}
            </Badge>
          </div>
          <p className="font-bold text-lg">{content.voucher.voucher_code}</p>
          <p className="text-sm opacity-90 mt-1">{content.voucher.voucher_name}</p>
          {content.voucher.min_purchase_amount > 0 && (
            <p className="text-xs opacity-75 mt-2">
              Min. purchase: ${content.voucher.min_purchase_amount}
            </p>
          )}
        </div>
      );

    case 'category_list':
      return (
        <div className="flex flex-wrap gap-2">
          {content.categories.map((category) => (
            <Badge key={category.product_category_id} variant="outline">
              {category.product_category_name}
            </Badge>
          ))}
        </div>
      );

    case 'quick_replies':
      return (
        <QuickReplies
          options={content.options}
          onSelect={(option) => onQuickReply?.(option)}
        />
      );

    case 'error':
      return (
        <div className="bg-destructive/10 text-destructive rounded-lg p-3 max-w-[300px]">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Something went wrong</p>
              <p className="text-sm opacity-80">{content.message}</p>
            </div>
          </div>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      );

    default:
      return null;
  }
}
