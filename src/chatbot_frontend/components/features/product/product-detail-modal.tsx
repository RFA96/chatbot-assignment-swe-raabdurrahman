'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, Loader2, Package, Tag } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StockIndicator } from './stock-badge';
import { productService } from '@/services/product.service';
import { stockService } from '@/services/stock.service';
import { formatPrice } from '@/lib/utils';
import type { ProductWithCategory, ProductStock } from '@/types/api';

interface ProductDetailModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (productId: number) => void;
}

export function ProductDetailModal({
  productId,
  isOpen,
  onClose,
  onAddToCart,
}: ProductDetailModalProps) {
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [stock, setStock] = useState<ProductStock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      fetchProductDetails(productId);
    } else {
      // Reset state when modal closes
      setProduct(null);
      setStock(null);
      setError(null);
    }
  }, [isOpen, productId]);

  const fetchProductDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const [productData, stockData] = await Promise.all([
        productService.getProductById(id),
        stockService.getProductStock(id).catch(() => null),
      ]);

      setProduct(productData);
      setStock(stockData);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
      setError('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !onAddToCart) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(product.product_id);
      onClose();
    } finally {
      setIsAddingToCart(false);
    }
  };

  const imageUrl = productId
    ? `https://picsum.photos/seed/${productId}/600/600`
    : '';

  const isOutOfStock = stock?.stock_status === 'OUT_OF_STOCK';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-destructive">
          <p>{error}</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            Close
          </Button>
        </div>
      ) : product ? (
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image */}
          <div className="relative aspect-square bg-muted">
            <Image
              src={imageUrl}
              alt={product.product_name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <Badge variant="secondary" className="absolute top-3 left-3">
              {product.department}
            </Badge>
            {stock && (
              <div className="absolute top-3 right-3">
                <StockIndicator stock={stock} size="sm" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-6 flex flex-col">
            <div className="flex-1">
              {/* Category */}
              {'category' in product && product.category && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Tag className="h-3 w-3" />
                  {product.category.product_category_name}
                </div>
              )}

              {/* Brand */}
              <p className="text-sm text-muted-foreground uppercase tracking-wide">
                {product.product_brand}
              </p>

              {/* Name */}
              <h2 className="text-xl font-bold mt-1 mb-4">
                {product.product_name}
              </h2>

              {/* Price */}
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-4">
                {formatPrice(product.retail_price)}
              </p>

              {/* Stock Info */}
              {stock && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Package className="h-4 w-4" />
                  <span>
                    {stock.available_quantity > 0
                      ? `${stock.available_quantity} available`
                      : 'Out of stock'}
                  </span>
                </div>
              )}

              {/* Product ID */}
              <p className="text-xs text-muted-foreground">
                Product ID: {product.product_id}
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 space-y-3">
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock}
              >
                {isAddingToCart ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <ShoppingCart className="h-5 w-5 mr-2" />
                )}
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={onClose}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
