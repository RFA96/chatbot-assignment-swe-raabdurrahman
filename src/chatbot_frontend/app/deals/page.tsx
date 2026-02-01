'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tag, Percent, Clock, Zap, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Header, Footer } from '@/components/layout';
import { ChatWidget } from '@/components/features/chat';
import { productService } from '@/services/product.service';
import { cartService } from '@/services/cart.service';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types/api';

// Simulate deals by applying discounts to products
const getDiscount = (productId: number): number => {
  // Use product ID to generate consistent "random" discounts
  const discounts = [10, 15, 20, 25, 30, 35, 40, 50];
  return discounts[productId % discounts.length];
};

const dealBanners = [
  {
    title: 'Flash Sale',
    subtitle: 'Up to 50% off on selected items',
    icon: Zap,
    gradient: 'from-orange-500 to-red-500',
  },
  {
    title: 'Limited Time Offer',
    subtitle: 'Don\'t miss these amazing deals',
    icon: Clock,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    title: 'Special Discounts',
    subtitle: 'Exclusive offers for you',
    icon: Percent,
    gradient: 'from-green-500 to-emerald-500',
  },
];

export default function DealsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<number | null>(null);

  const { updateItemCount } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      // Load products and treat them as deals with discounts
      const result = await productService.getProducts({
        page: 1,
        page_size: 12,
      });
      setProducts(result.items);
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = useCallback(async (productId: number) => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }

    setAddingToCart(productId);
    try {
      await cartService.addToCart(productId);
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(null);
    }
  }, [updateItemCount, isAuthenticated, openAuthModal]);

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 text-white py-12 md:py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4">
              <Tag className="h-8 w-8" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3">Hot Deals & Offers</h1>
            <p className="text-white/90 max-w-2xl mx-auto text-lg">
              Discover amazing discounts on your favorite products. Limited time offers you don't want to miss!
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Deal Banners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            {dealBanners.map((banner, index) => (
              <Card
                key={index}
                className={`overflow-hidden bg-gradient-to-r ${banner.gradient} text-white border-0`}
              >
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <banner.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{banner.title}</h3>
                    <p className="text-white/80 text-sm">{banner.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Deals Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Today's Best Deals</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-4" />
                      <Skeleton className="h-6 w-1/3 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No deals available at the moment</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => {
                  const discount = getDiscount(product.product_id);
                  const originalPrice = product.retail_price;
                  const discountedPrice = originalPrice * (1 - discount / 100);

                  return (
                    <Card
                      key={product.product_id}
                      className="group overflow-hidden hover:shadow-xl transition-all duration-300"
                    >
                      {/* Product Image */}
                      <div className="relative h-48 overflow-hidden bg-muted">
                        <Image
                          src={`https://picsum.photos/seed/${product.product_id}/400/400`}
                          alt={product.product_name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        />
                        {/* Discount Badge */}
                        <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-500 text-white">
                          -{discount}% OFF
                        </Badge>
                        {/* Quick Actions */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10"
                            onClick={() => handleViewProduct(product.product_id)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            className="h-10 w-10"
                            onClick={() => handleAddToCart(product.product_id)}
                            disabled={addingToCart === product.product_id}
                          >
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        {/* Product Info */}
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            {product.product_brand}
                          </p>
                          <h3 className="font-medium line-clamp-2 min-h-[2.5rem]">
                            {product.product_name}
                          </h3>
                        </div>

                        {/* Department Badge */}
                        <Badge variant="outline" className="mb-3">
                          {product.department}
                        </Badge>

                        {/* Price */}
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                            {formatPrice(discountedPrice)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                          className="w-full gap-2"
                          onClick={() => handleAddToCart(product.product_id)}
                          disabled={addingToCart === product.product_id}
                        >
                          <ShoppingCart className="h-4 w-4" />
                          {addingToCart === product.product_id ? 'Adding...' : 'Add to Cart'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Promo Code Section */}
          <Card className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-primary-500/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">Use Code: FREESHIP</h2>
              <p className="text-muted-foreground mb-4">
                Get free shipping on orders over $50. Limited time offer!
              </p>
              <Button
                size="lg"
                onClick={() => router.push('/products')}
              >
                Shop Now
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
