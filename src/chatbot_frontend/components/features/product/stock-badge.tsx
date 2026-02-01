'use client';

import { Package, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StockStatus, ProductStock } from '@/types/api';

interface StockBadgeProps {
  status: StockStatus;
  availableQuantity?: number;
  showQuantity?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

const stockConfig: Record<
  StockStatus,
  {
    label: string;
    variant: 'success' | 'warning' | 'destructive';
    icon: React.ElementType;
  }
> = {
  IN_STOCK: {
    label: 'In Stock',
    variant: 'success',
    icon: CheckCircle,
  },
  LOW_STOCK: {
    label: 'Low Stock',
    variant: 'warning',
    icon: AlertTriangle,
  },
  OUT_OF_STOCK: {
    label: 'Out of Stock',
    variant: 'destructive',
    icon: XCircle,
  },
};

export function StockBadge({
  status,
  availableQuantity,
  showQuantity = false,
  size = 'default',
  className,
}: StockBadgeProps) {
  const config = stockConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    default: 'text-xs px-2.5 py-0.5',
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-3.5 w-3.5',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn('gap-1', sizeClasses[size], className)}
    >
      <Icon className={iconSizeClasses[size]} />
      <span>
        {config.label}
        {showQuantity && availableQuantity !== undefined && status !== 'OUT_OF_STOCK'
          ? ` (${availableQuantity})`
          : ''}
      </span>
    </Badge>
  );
}

interface StockIndicatorProps {
  stock: ProductStock | null;
  isLoading?: boolean;
  showQuantity?: boolean;
  size?: 'sm' | 'default';
  className?: string;
}

export function StockIndicator({
  stock,
  isLoading = false,
  showQuantity = false,
  size = 'default',
  className,
}: StockIndicatorProps) {
  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
        <Package className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />
        <span className={size === 'sm' ? 'text-[10px]' : 'text-xs'}>
          Checking stock...
        </span>
      </div>
    );
  }

  if (!stock) {
    return null;
  }

  // If stock tracking is disabled, show as available
  if (!stock.is_track_stock) {
    return (
      <StockBadge
        status="IN_STOCK"
        showQuantity={false}
        size={size}
        className={className}
      />
    );
  }

  return (
    <StockBadge
      status={stock.stock_status}
      availableQuantity={stock.available_quantity}
      showQuantity={showQuantity}
      size={size}
      className={className}
    />
  );
}

interface StockInfoProps {
  stock: ProductStock | null;
  isLoading?: boolean;
  className?: string;
}

export function StockInfo({ stock, isLoading = false, className }: StockInfoProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-4 w-4 animate-pulse" />
          <span className="text-sm">Checking availability...</span>
        </div>
      </div>
    );
  }

  if (!stock) {
    return null;
  }

  // If stock tracking is disabled
  if (!stock.is_track_stock) {
    return (
      <div className={cn('space-y-2', className)}>
        <div className="flex items-center gap-2">
          <StockBadge status="IN_STOCK" />
          <span className="text-sm text-muted-foreground">Always available</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <StockBadge status={stock.stock_status} />
        {stock.stock_status !== 'OUT_OF_STOCK' && (
          <span className="text-sm text-muted-foreground">
            {stock.available_quantity} available
          </span>
        )}
      </div>
      {stock.stock_status === 'LOW_STOCK' && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">
          Only {stock.available_quantity} left! Order soon.
        </p>
      )}
      {stock.stock_status === 'OUT_OF_STOCK' && (
        <p className="text-xs text-destructive">
          This item is currently unavailable.
        </p>
      )}
    </div>
  );
}
