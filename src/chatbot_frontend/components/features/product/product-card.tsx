'use client';

import Image from 'next/image';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockIndicator } from './stock-badge';
import { cn, formatPrice } from '@/lib/utils';
import type { Product, ProductWithCategory, ProductStock } from '@/types/api';

interface ProductCardProps {
  product: Product | ProductWithCategory;
  stock?: ProductStock | null;
  stockLoading?: boolean;
  showStock?: boolean;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
  isLoading?: boolean;
  showActions?: boolean;
  variant?: 'default' | 'compact' | 'chat';
  className?: string;
}

export function ProductCard({
  product,
  stock,
  stockLoading = false,
  showStock = false,
  onAddToCart,
  onViewDetails,
  isLoading = false,
  showActions = true,
  variant = 'default',
  className,
}: ProductCardProps) {
  // Generate placeholder image URL based on product
  const imageUrl = `https://picsum.photos/seed/${product.product_id}/400/400`;

  // Determine if the product is out of stock
  const isOutOfStock = stock?.stock_status === 'OUT_OF_STOCK';

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer',
          isOutOfStock && 'opacity-60',
          className
        )}
        onClick={() => onViewDetails?.(product.product_id)}
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image
            src={imageUrl}
            alt={product.product_name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{product.product_name}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">{product.product_brand}</p>
            {showStock && stock && (
              <StockIndicator stock={stock} isLoading={stockLoading} size="sm" />
            )}
          </div>
        </div>
        <p className="text-sm font-semibold text-primary-600 dark:text-primary-400">
          {formatPrice(product.retail_price)}
        </p>
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div
        className={cn(
          'chat-product-card max-w-[280px]',
          isOutOfStock && 'opacity-75',
          className
        )}
      >
        <div className="relative h-36 w-full bg-muted">
          <Image
            src={imageUrl}
            alt={product.product_name}
            fill
            className={cn('object-cover', isOutOfStock && 'grayscale')}
            sizes="280px"
          />
          <Badge
            variant="secondary"
            className="absolute top-2 left-2"
          >
            {product.department}
          </Badge>
          {showStock && stock && (
            <div className="absolute top-2 right-2">
              <StockIndicator stock={stock} isLoading={stockLoading} size="sm" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          <div>
            <p className="font-medium text-sm line-clamp-1">{product.product_name}</p>
            <p className="text-xs text-muted-foreground">{product.product_brand}</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(product.retail_price)}
            </p>
            <Button
              size="sm"
              onClick={() => onAddToCart?.(product.product_id)}
              disabled={isLoading || isOutOfStock}
              className="h-8"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              {isOutOfStock ? 'Out' : 'Add'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        'group rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-lg',
        isOutOfStock && 'opacity-75',
        className
      )}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={imageUrl}
          alt={product.product_name}
          fill
          className={cn(
            'object-cover transition-transform group-hover:scale-105',
            isOutOfStock && 'grayscale'
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <Badge
          variant="secondary"
          className="absolute top-3 left-3"
        >
          {product.department}
        </Badge>

        {/* Stock indicator badge */}
        {showStock && stock && (
          <div className="absolute top-3 right-3">
            <StockIndicator stock={stock} isLoading={stockLoading} size="sm" />
          </div>
        )}

        {/* Quick actions overlay */}
        {showActions && !isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => onViewDetails?.(product.product_id)}
              className="h-10 w-10"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              onClick={() => onAddToCart?.(product.product_id)}
              disabled={isLoading}
              className="h-10 w-10"
            >
              <ShoppingCart className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Out of stock overlay */}
        {showActions && isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-semibold">
              Out of Stock
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.product_brand}
          </p>
          <h3 className="font-medium line-clamp-2 mt-1">
            {product.product_name}
          </h3>
        </div>

        {/* Stock indicator in content for non-showActions mode */}
        {showStock && stock && !showActions && (
          <StockIndicator stock={stock} isLoading={stockLoading} />
        )}

        <div className="flex items-center justify-between pt-2">
          <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
            {formatPrice(product.retail_price)}
          </p>

          {showActions && (
            <Button
              size="sm"
              onClick={() => onAddToCart?.(product.product_id)}
              disabled={isLoading || isOutOfStock}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
