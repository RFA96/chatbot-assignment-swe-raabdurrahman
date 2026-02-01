'use client';

import { ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CartItem } from './cart-item';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice, cn } from '@/lib/utils';
import type { Cart } from '@/types/api';

interface CartSummaryProps {
  cart: Cart | null;
  isLoading?: boolean;
  onRemoveItem?: (orderItemId: string) => void;
  onClearCart?: () => void;
  onCheckout?: () => void;
  removingItemId?: string | null;
  variant?: 'default' | 'compact' | 'chat';
  className?: string;
}

export function CartSummary({
  cart,
  isLoading = false,
  onRemoveItem,
  onClearCart,
  onCheckout,
  removingItemId,
  variant = 'default',
  className,
}: CartSummaryProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Card className={cn('text-center', className)}>
        <CardContent className="py-8">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Your cart is empty</p>
        </CardContent>
      </Card>
    );
  }

  // Compact variant for chat
  if (variant === 'chat') {
    return (
      <div className={cn('bg-card border border-border rounded-lg p-3 max-w-[300px]', className)}>
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-sm">Shopping Cart</span>
          <span className="text-xs text-muted-foreground">
            {cart.num_of_item} items
          </span>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {cart.items.slice(0, 3).map((item) => (
            <div key={item.order_item_id} className="flex items-center gap-2 text-xs">
              <span className="flex-1 truncate">{item.product_name}</span>
              <span className="shrink-0 font-medium">
                {formatPrice(item.retail_price)}
              </span>
            </div>
          ))}
          {cart.items.length > 3 && (
            <p className="text-xs text-muted-foreground">
              +{cart.items.length - 3} more items
            </p>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(cart.total_price)}
          </span>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Shopping Cart
          <span className="text-sm font-normal text-muted-foreground">
            ({cart.num_of_item} items)
          </span>
        </CardTitle>
        {onClearCart && cart.items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearCart}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="divide-y divide-border">
          {cart.items.map((item) => (
            <CartItem
              key={item.order_item_id}
              item={item}
              onRemove={onRemoveItem}
              isRemoving={removingItemId === item.order_item_id}
            />
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex-col space-y-4">
        <div className="w-full flex justify-between text-lg font-semibold">
          <span>Total</span>
          <span className="text-primary-600 dark:text-primary-400">
            {formatPrice(cart.total_price)}
          </span>
        </div>

        {onCheckout && (
          <Button
            className="w-full"
            size="lg"
            onClick={onCheckout}
          >
            Proceed to Checkout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
