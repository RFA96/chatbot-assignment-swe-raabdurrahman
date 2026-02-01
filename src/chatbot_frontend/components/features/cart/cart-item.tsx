'use client';

import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/types/api';

interface CartItemProps {
  item: CartItemType;
  onRemove?: (orderItemId: string) => void;
  isRemoving?: boolean;
}

export function CartItem({ item, onRemove, isRemoving = false }: CartItemProps) {
  const imageUrl = `https://picsum.photos/seed/${item.product_id}/200/200`;

  return (
    <div className="flex gap-4 py-4 border-b border-border last:border-0">
      {/* Product Image */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        <Image
          src={imageUrl}
          alt={item.product_name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </div>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm line-clamp-2">
          {item.product_name}
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          {item.product_brand}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.department}
        </p>
      </div>

      {/* Price and Remove */}
      <div className="flex flex-col items-end justify-between">
        <p className="font-semibold text-primary-600 dark:text-primary-400">
          {formatPrice(item.retail_price)}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove?.(item.order_item_id)}
          disabled={isRemoving}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
