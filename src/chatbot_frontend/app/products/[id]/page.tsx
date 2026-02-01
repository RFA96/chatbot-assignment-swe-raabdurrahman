'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ChevronLeft,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RefreshCw,
  Star,
  Minus,
  Plus,
  Check,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header, Footer } from '@/components/layout';
import { ProductCarousel, StockInfo } from '@/components/features/product';
import { ChatWidget } from '@/components/features/chat';
import { productService } from '@/services/product.service';
import { cartService } from '@/services/cart.service';
import { stockService } from '@/services/stock.service';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice, cn } from '@/lib/utils';
import type { ProductWithCategory, Product, ProductStock } from '@/types/api';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params.id);

  const [mounted, setMounted] = useState(false);
  const [product, setProduct] = useState<ProductWithCategory | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<ProductStock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStockLoading, setIsStockLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [stockError, setStockError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const { updateItemCount } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  // Generate placeholder images for gallery
  const productImages = [
    `https://picsum.photos/seed/${productId}/600/600`,
    `https://picsum.photos/seed/${productId + 1}/600/600`,
    `https://picsum.photos/seed/${productId + 2}/600/600`,
    `https://picsum.photos/seed/${productId + 3}/600/600`,
  ];

  useEffect(() => {
    setMounted(true);
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    setIsLoading(true);
    setIsStockLoading(true);
    setStockError(null);
    try {
      const [productResult, relatedResult] = await Promise.all([
        productService.getProductById(productId),
        productService.getProducts({ page_size: 6 }),
      ]);

      setProduct(productResult);
      // Filter out current product from related
      setRelatedProducts(
        relatedResult.items.filter((p) => p.product_id !== productId)
      );
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setIsLoading(false);
    }

    // Load stock separately to not block the main product loading
    try {
      const stockResult = await stockService.getProductStock(productId);
      setStock(stockResult);
    } catch (error) {
      console.error('Failed to load stock:', error);
      setStock(null);
    } finally {
      setIsStockLoading(false);
    }
  };

  const handleAddToCart = useCallback(async () => {
    if (!product) return;

    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    // Check stock availability
    if (stock?.is_track_stock && stock?.available_quantity !== undefined) {
      if (stock.available_quantity < quantity) {
        setStockError(
          stock.available_quantity === 0
            ? 'This product is out of stock.'
            : `Only ${stock.available_quantity} items available.`
        );
        return;
      }
    }

    setIsAddingToCart(true);
    setStockError(null);
    try {
      // Add to cart multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        await cartService.addToCart(product.product_id);
      }
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);

      // Refresh stock after adding to cart
      try {
        const updatedStock = await stockService.getProductStock(productId);
        setStock(updatedStock);
      } catch {
        // Ignore stock refresh errors
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      if (error instanceof Error && error.message.includes('stock')) {
        setStockError(error.message);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, productId, quantity, stock, updateItemCount, isAuthenticated, openAuthModal]);

  const handleRelatedAddToCart = useCallback(async (productId: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    try {
      await cartService.addToCart(productId);
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  }, [updateItemCount, isAuthenticated, openAuthModal]);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground">Products</Link>
            <span>/</span>
            <span className="text-foreground">{product?.product_name || 'Loading...'}</span>
          </nav>

          {isLoading ? (
            <ProductDetailSkeleton />
          ) : product ? (
            <>
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
                    <Image
                      src={productImages[selectedImage]}
                      alt={product.product_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      priority
                    />
                    <Badge className="absolute top-4 left-4">{product.department}</Badge>
                  </div>

                  {/* Thumbnail Gallery */}
                  <div className="flex gap-3">
                    {productImages.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          'relative w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                          selectedImage === index
                            ? 'border-primary-500'
                            : 'border-transparent hover:border-muted-foreground/50'
                        )}
                      >
                        <Image
                          src={img}
                          alt={`${product.product_name} - ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  {/* Header */}
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
                      {product.product_brand}
                    </p>
                    <h1 className="text-3xl font-bold mb-3">{product.product_name}</h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'h-5 w-5',
                              i < 4
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        4.0 (128 reviews)
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                        {formatPrice(product.retail_price)}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.retail_price * 1.2)}
                      </span>
                      <Badge variant="destructive">-20%</Badge>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <Link href={`/products?category=${product.category.product_category_id}`}>
                      <Badge variant="outline">{product.category.product_category_name}</Badge>
                    </Link>
                  </div>

                  {/* Stock Information */}
                  <div className="py-2">
                    <StockInfo stock={stock} isLoading={isStockLoading} />
                  </div>

                  {/* Description */}
                  <div className="prose prose-sm dark:prose-invert">
                    <p className="text-muted-foreground">
                      Elevate your style with this premium {product.product_name.toLowerCase()} from {product.product_brand}.
                      Crafted with attention to detail and made from high-quality materials, this piece is perfect
                      for any occasion. Whether you're dressing up for a special event or keeping it casual,
                      this item will be your go-to choice.
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || stock?.stock_status === 'OUT_OF_STOCK'}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={
                          stock?.stock_status === 'OUT_OF_STOCK' ||
                          (stock?.is_track_stock && stock?.available_quantity !== undefined && quantity >= stock.available_quantity)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {stock?.is_track_stock && stock?.available_quantity !== undefined && stock.available_quantity > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (Max: {stock.available_quantity})
                        </span>
                      )}
                    </div>
                    {stockError && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{stockError}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      size="lg"
                      className="flex-1 gap-2"
                      onClick={handleAddToCart}
                      disabled={
                        isAddingToCart ||
                        addedToCart ||
                        stock?.stock_status === 'OUT_OF_STOCK' ||
                        isStockLoading
                      }
                    >
                      {addedToCart ? (
                        <>
                          <Check className="h-5 w-5" />
                          Added to Cart
                        </>
                      ) : isAddingToCart ? (
                        'Adding...'
                      ) : stock?.stock_status === 'OUT_OF_STOCK' ? (
                        <>
                          <Package className="h-5 w-5" />
                          Out of Stock
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-5 w-5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                    <Button size="lg" variant="outline" className="gap-2">
                      <Heart className="h-5 w-5" />
                      Wishlist
                    </Button>
                    <Button size="icon" variant="outline">
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>

                  {/* Features */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
                    <div className="flex flex-col items-center text-center gap-2">
                      <Truck className="h-6 w-6 text-primary-500" />
                      <span className="text-xs text-muted-foreground">Free Shipping</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <Shield className="h-6 w-6 text-primary-500" />
                      <span className="text-xs text-muted-foreground">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <RefreshCw className="h-6 w-6 text-primary-500" />
                      <span className="text-xs text-muted-foreground">30-Day Returns</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Details Tabs */}
              <div className="mt-12 border-t border-border pt-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Product Details</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><span className="text-foreground">Brand:</span> {product.product_brand}</li>
                      <li><span className="text-foreground">Category:</span> {product.category.product_category_name}</li>
                      <li><span className="text-foreground">Department:</span> {product.department}</li>
                      <li><span className="text-foreground">SKU:</span> PRD-{product.product_id}</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Shipping Info</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Free standard shipping on orders over $50</li>
                      <li>Express shipping available</li>
                      <li>Ships within 1-2 business days</li>
                      <li>International shipping available</li>
                    </ul>
                  </Card>

                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Returns & Warranty</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>30-day return policy</li>
                      <li>Free returns on all orders</li>
                      <li>1-year manufacturer warranty</li>
                      <li>Easy exchange process</li>
                    </ul>
                  </Card>
                </div>
              </div>

              {/* Related Products */}
              {relatedProducts.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <ProductCarousel
                    title="You May Also Like"
                    products={relatedProducts}
                    onAddToCart={handleRelatedAddToCart}
                    onViewDetails={(id) => router.push(`/products/${id}`)}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">Product not found</p>
              <Link href="/products">
                <Button>Back to Products</Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
      <div className="space-y-4">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-20 h-20 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-24 w-full" />
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 w-32" />
        </div>
      </div>
    </div>
  );
}
