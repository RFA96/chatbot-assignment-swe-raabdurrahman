'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  Grid3X3,
  LayoutList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header, Footer } from '@/components/layout';
import { ProductCard } from '@/components/features/product';
import { ChatWidget } from '@/components/features/chat';
import { productService, categoryService } from '@/services/product.service';
import { cartService } from '@/services/cart.service';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import type { Product, ProductCategory, Department } from '@/types/api';

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsPageSkeleton />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>(
    (searchParams.get('department') as Department) || ''
  );
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [priceRange, setPriceRange] = useState({
    min: searchParams.get('min_price') || '',
    max: searchParams.get('max_price') || '',
  });

  // UI State
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { updateItemCount } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    loadInitialData();
  }, []);

  useEffect(() => {
    if (mounted) {
      loadProducts();
    }
  }, [selectedCategory, selectedDepartment, selectedBrand, currentPage, mounted]);

  const loadInitialData = async () => {
    try {
      const [categoriesResult, brandsResult] = await Promise.all([
        categoryService.getCategories(),
        productService.getBrands(),
      ]);
      setCategories(categoriesResult.items);
      setBrands(brandsResult.brands);
    } catch (error) {
      console.error('Failed to load filter data:', error);
    }
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const result = await productService.getProducts({
        page: currentPage,
        page_size: 12,
        category_id: selectedCategory || undefined,
        department: selectedDepartment || undefined,
        brand: selectedBrand || undefined,
        min_price: priceRange.min ? parseFloat(priceRange.min) : undefined,
        max_price: priceRange.max ? parseFloat(priceRange.max) : undefined,
        search: search || undefined,
      });

      setProducts(result.items);
      setTotalProducts(result.total);
      setTotalPages(result.total_pages);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadProducts();
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

  const handleViewProduct = (productId: number) => {
    router.push(`/products/${productId}`);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedDepartment('');
    setSelectedBrand('');
    setPriceRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory || selectedDepartment || selectedBrand || priceRange.min || priceRange.max || search;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        {/* Sticky Page Header - positioned below main header (promo ~36px + nav 64px + border 1px = 101px) */}
        <div className="sticky top-[101px] z-40 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-3xl font-bold mb-1">All Products</h1>
            <p className="text-muted-foreground">
              Showing {products.length} of {totalProducts} products
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters - Desktop */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-[190px] max-h-[calc(100vh-210px)] overflow-y-auto">
                <FilterSidebar
                  categories={categories}
                  brands={brands}
                  selectedCategory={selectedCategory}
                  selectedDepartment={selectedDepartment}
                  selectedBrand={selectedBrand}
                  priceRange={priceRange}
                  onCategoryChange={setSelectedCategory}
                  onDepartmentChange={setSelectedDepartment}
                  onBrandChange={setSelectedBrand}
                  onPriceRangeChange={setPriceRange}
                  onApplyFilters={loadProducts}
                />
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>Search</Button>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mobile filter toggle */}
                  <Button
                    variant="outline"
                    className="lg:hidden gap-2"
                    onClick={() => setMobileFiltersOpen(true)}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>

                  {/* View mode toggle */}
                  <div className="flex border border-border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9"
                      onClick={() => setViewMode('list')}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active Filters */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span className="text-sm text-muted-foreground">Active filters:</span>
                  {selectedCategory && (
                    <Badge variant="secondary" className="gap-1">
                      Category: {categories.find(c => c.product_category_id === selectedCategory)?.product_category_name}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
                    </Badge>
                  )}
                  {selectedDepartment && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedDepartment}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedDepartment('')} />
                    </Badge>
                  )}
                  {selectedBrand && (
                    <Badge variant="secondary" className="gap-1">
                      {selectedBrand}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBrand('')} />
                    </Badge>
                  )}
                  {(priceRange.min || priceRange.max) && (
                    <Badge variant="secondary" className="gap-1">
                      ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceRange({ min: '', max: '' })} />
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </div>
              )}

              {/* Products Grid */}
              {isLoading ? (
                <div className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                )}>
                  {[...Array(6)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <Skeleton className="h-48 w-full mb-4" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3 mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </Card>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg mb-4">No products found</p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </div>
              ) : (
                <div className={cn(
                  'grid gap-4',
                  viewMode === 'grid'
                    ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                    : 'grid-cols-1'
                )}>
                  {products.map((product) => (
                    <ProductCard
                      key={product.product_id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewProduct}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="px-4 text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-background z-50 lg:hidden overflow-y-auto animate-slide-in-left">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <FilterSidebar
                categories={categories}
                brands={brands}
                selectedCategory={selectedCategory}
                selectedDepartment={selectedDepartment}
                selectedBrand={selectedBrand}
                priceRange={priceRange}
                onCategoryChange={setSelectedCategory}
                onDepartmentChange={setSelectedDepartment}
                onBrandChange={setSelectedBrand}
                onPriceRangeChange={setPriceRange}
                onApplyFilters={() => {
                  loadProducts();
                  setMobileFiltersOpen(false);
                }}
              />
            </div>
          </div>
        </>
      )}

      <Footer />
      <ChatWidget />
    </div>
  );
}

interface FilterSidebarProps {
  categories: ProductCategory[];
  brands: string[];
  selectedCategory: string;
  selectedDepartment: Department | '';
  selectedBrand: string;
  priceRange: { min: string; max: string };
  onCategoryChange: (value: string) => void;
  onDepartmentChange: (value: Department | '') => void;
  onBrandChange: (value: string) => void;
  onPriceRangeChange: (value: { min: string; max: string }) => void;
  onApplyFilters: () => void;
}

function FilterSidebar({
  categories,
  brands,
  selectedCategory,
  selectedDepartment,
  selectedBrand,
  priceRange,
  onCategoryChange,
  onDepartmentChange,
  onBrandChange,
  onPriceRangeChange,
  onApplyFilters,
}: FilterSidebarProps) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <FilterSection title="Categories">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={selectedCategory === ''}
              onChange={() => onCategoryChange('')}
              className="accent-primary-500"
            />
            <span className="text-sm">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.product_category_id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                checked={selectedCategory === category.product_category_id}
                onChange={() => onCategoryChange(category.product_category_id)}
                className="accent-primary-500"
              />
              <span className="text-sm">{category.product_category_name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Department */}
      <FilterSection title="Department">
        <div className="space-y-2">
          {['', 'Men', 'Women'].map((dept) => (
            <label key={dept || 'all'} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="department"
                checked={selectedDepartment === dept}
                onChange={() => onDepartmentChange(dept as Department | '')}
                className="accent-primary-500"
              />
              <span className="text-sm">{dept || 'All'}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Brands */}
      <FilterSection title="Brands">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="brand"
              checked={selectedBrand === ''}
              onChange={() => onBrandChange('')}
              className="accent-primary-500"
            />
            <span className="text-sm">All Brands</span>
          </label>
          {brands.slice(0, 10).map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="brand"
                checked={selectedBrand === brand}
                onChange={() => onBrandChange(brand)}
                className="accent-primary-500"
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) => onPriceRangeChange({ ...priceRange, min: e.target.value })}
            className="h-9"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) => onPriceRangeChange({ ...priceRange, max: e.target.value })}
            className="h-9"
          />
        </div>
      </FilterSection>

      <Button className="w-full" onClick={onApplyFilters}>
        Apply Filters
      </Button>
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-medium mb-3"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && children}
    </div>
  );
}
