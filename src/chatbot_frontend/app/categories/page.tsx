'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Grid3X3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header, Footer } from '@/components/layout';
import { ChatWidget } from '@/components/features/chat';
import { categoryService } from '@/services/product.service';
import type { ProductCategory } from '@/types/api';

// Category images mapping
const categoryImages: Record<string, string> = {
  'Accessories': 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600',
  'Apparel': 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600',
  'Footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
  'Sportswear': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=600',
  'Outerwear': 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
  'Activewear': 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=600',
};

const defaultCategoryImage = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600';

export default function CategoriesPage() {
  const [mounted, setMounted] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await categoryService.getCategories();
      setCategories(result.items);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryImage = (categoryName: string) => {
    return categoryImages[categoryName] || defaultCategoryImage;
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 mb-4">
              <Grid3X3 className="h-8 w-8 text-primary-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Shop by Category</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our wide range of products organized by category. Find exactly what you're looking for.
            </p>
          </div>

          {/* Categories Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No categories found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <Link
                  key={category.product_category_id}
                  href={`/products?category=${category.product_category_id}`}
                >
                  <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary-500/20">
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={getCategoryImage(category.product_category_name)}
                        alt={category.product_category_name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-white font-semibold text-xl mb-1">
                          {category.product_category_name}
                        </h3>
                        <p className="text-white/80 text-sm flex items-center gap-1 group-hover:text-primary-300 transition-colors">
                          Browse Products
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Browse All Section */}
          <div className="mt-16 text-center">
            <div className="inline-block p-8 rounded-2xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20">
              <h2 className="text-2xl font-semibold mb-2">Can't find what you're looking for?</h2>
              <p className="text-muted-foreground mb-4">
                Browse all our products and use filters to find exactly what you need.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
              >
                View All Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}
