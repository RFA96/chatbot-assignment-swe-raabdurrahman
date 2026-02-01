'use client';

import { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './product-card';
import { SkeletonProductCard } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/api';

interface ProductCarouselProps {
  products: Product[];
  title?: string;
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductCarousel({
  products,
  title,
  onAddToCart,
  onViewDetails,
  isLoading = false,
  className,
}: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    skipSnaps: false,
    dragFree: true,
  });

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {title && (
          <h2 className="text-xl font-semibold">{title}</h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No products to display
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {products.map((product) => (
            <div
              key={product.product_id}
              className="flex-none w-[280px] min-w-0"
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={onViewDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Grid variant for non-carousel display
interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
  isLoading?: boolean;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ProductGrid({
  products,
  onAddToCart,
  onViewDetails,
  isLoading = false,
  columns = 4,
  className,
}: ProductGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {[...Array(columns)].map((_, i) => (
          <SkeletonProductCard key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        No products found
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {products.map((product) => (
        <ProductCard
          key={product.product_id}
          product={product}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
