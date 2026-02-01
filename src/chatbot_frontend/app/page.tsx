'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Truck,
  Shield,
  RefreshCw,
  Clock,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header, Footer } from '@/components/layout';
import { ProductCarousel } from '@/components/features/product';
import { ChatWidget } from '@/components/features/chat';
import { productService, categoryService } from '@/services/product.service';
import { cartService } from '@/services/cart.service';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductCategory } from '@/types/api';

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { updateItemCount } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        productService.getProducts({ page_size: 12 }),
        categoryService.getCategories(),
      ]);

      setFeaturedProducts(productsResult.items.slice(0, 6));
      setNewArrivals(productsResult.items.slice(6, 12));
      setCategories(categoriesResult.items);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = useCallback(async (productId: number) => {
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
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-background overflow-hidden">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <Badge variant="secondary" className="w-fit">
                  New Season Collection
                </Badge>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Discover Your{' '}
                  <span className="text-primary-500">Perfect Style</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-md">
                  Shop the latest trends with AI-powered recommendations.
                  Find what you love, faster than ever.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/products">
                    <Button size="lg" className="gap-2">
                      Shop Now
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/chat">
                    <Button size="lg" variant="outline" className="gap-2">
                      Ask ShopBot
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative h-[300px] md:h-[500px]">
                <Image
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800"
                  alt="Shopping"
                  fill
                  className="object-cover rounded-2xl"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                {/* Floating discount card */}
                <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl p-4 shadow-lg">
                  <p className="text-sm text-muted-foreground">Limited Time</p>
                  <p className="text-2xl font-bold text-primary-500">30% OFF</p>
                  <p className="text-sm">On selected items</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <FeatureItem
                icon={<Truck className="h-6 w-6" />}
                title="Free Shipping"
                description="On orders over $50"
              />
              <FeatureItem
                icon={<RefreshCw className="h-6 w-6" />}
                title="Easy Returns"
                description="30 day return policy"
              />
              <FeatureItem
                icon={<Shield className="h-6 w-6" />}
                title="Secure Payment"
                description="100% secure checkout"
              />
              <FeatureItem
                icon={<Clock className="h-6 w-6" />}
                title="24/7 Support"
                description="AI-powered assistance"
              />
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Shop by Category</h2>
                <p className="text-muted-foreground mt-1">
                  Browse our wide selection of products
                </p>
              </div>
              <Link href="/categories">
                <Button variant="ghost" className="gap-2">
                  View All
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 4).map((category, index) => (
                <CategoryCard
                  key={category.product_category_id}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <ProductCarousel
              title="Featured Products"
              products={featuredProducts}
              isLoading={isLoading}
              onAddToCart={handleAddToCart}
            />
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-primary-600 to-primary-500 text-white">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    Summer Sale is Live!
                  </h2>
                  <p className="text-white/90 text-lg">
                    Get up to 50% off on summer essentials. Limited time offer.
                  </p>
                </div>
                <Link href="/deals">
                  <Button size="lg" variant="secondary" className="gap-2 whitespace-nowrap">
                    Shop the Sale
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <ProductCarousel
              title="New Arrivals"
              products={newArrivals}
              isLoading={isLoading}
              onAddToCart={handleAddToCart}
            />
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">What Our Customers Say</h2>
              <p className="text-muted-foreground mt-1">
                Join thousands of satisfied shoppers
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <TestimonialCard
                name="Sarah M."
                rating={5}
                comment="ShopBot made finding the perfect outfit so easy! The AI recommendations were spot on."
                avatar="SM"
              />
              <TestimonialCard
                name="James L."
                rating={5}
                comment="Fast shipping, great quality products, and the chatbot helped me find exactly what I needed."
                avatar="JL"
              />
              <TestimonialCard
                name="Emily R."
                rating={5}
                comment="I love how easy it is to shop here. The interface is beautiful and the prices are fair."
                avatar="ER"
              />
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-muted-foreground mb-6">
                Get the latest updates on new products and upcoming sales
              </p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Button size="lg">Subscribe</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

function FeatureItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-500 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function CategoryCard({
  category,
  index,
}: {
  category: ProductCategory;
  index: number;
}) {
  const images = [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400',
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=400',
  ];

  return (
    <Link href={`/products?category=${category.product_category_id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all cursor-pointer">
        <div className="relative h-40 md:h-52">
          <Image
            src={images[index % images.length]}
            alt={category.product_category_name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h3 className="text-white font-semibold text-lg">
              {category.product_category_name}
            </h3>
            <p className="text-white/80 text-sm flex items-center gap-1 mt-1">
              Shop Now
              <ChevronRight className="h-4 w-4" />
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function TestimonialCard({
  name,
  rating,
  comment,
  avatar,
}: {
  name: string;
  rating: number;
  comment: string;
  avatar: string;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-muted-foreground mb-4">&quot;{comment}&quot;</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-500 flex items-center justify-center font-medium">
          {avatar}
        </div>
        <span className="font-medium">{name}</span>
      </div>
    </Card>
  );
}
