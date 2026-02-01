'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, Plus, Minus, Tag, ShoppingBag, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Header, Footer } from '@/components/layout';
import { ChatWidget } from '@/components/features/chat';
import { StockIndicator } from '@/components/features/product';
import { CheckoutModal } from '@/components/features/checkout';
import { cartService } from '@/services/cart.service';
import { voucherService } from '@/services/order.service';
import { stockService } from '@/services/stock.service';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice } from '@/lib/utils';
import type { Cart, Voucher, ProductStock } from '@/types/api';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [cart, setCartState] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [stockInfo, setStockInfo] = useState<Record<number, ProductStock>>({});
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [stockCheckComplete, setStockCheckComplete] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const { setCart, updateItemCount } = useCartStore();
  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      loadCart();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadCart = async () => {
    setIsLoading(true);
    setStockCheckComplete(false);
    try {
      const result = await cartService.getCart();
      setCartState(result);
      setCart(result);

      // Load stock info for all unique products in cart
      if (result && result.items.length > 0) {
        loadStockInfo(result.items.map((item) => item.product_id));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      setCartState(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Lightweight refresh that doesn't show loading skeleton
  const refreshCart = async () => {
    try {
      const result = await cartService.getCart();
      setCartState(result);
      setCart(result);
    } catch (error) {
      console.error('Failed to refresh cart:', error);
    }
  };

  const loadStockInfo = async (productIds: number[]) => {
    const uniqueProductIds = [...new Set(productIds)];
    setIsStockLoading(true);

    try {
      const stockResults = await Promise.allSettled(
        uniqueProductIds.map((id) => stockService.getProductStock(id))
      );

      const newStockInfo: Record<number, ProductStock> = {};
      stockResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newStockInfo[uniqueProductIds[index]] = result.value;
        }
      });

      setStockInfo(newStockInfo);
      setStockCheckComplete(true);
    } catch (error) {
      console.error('Failed to load stock info:', error);
    } finally {
      setIsStockLoading(false);
    }
  };

  const refreshStockInfo = () => {
    if (cart && cart.items.length > 0) {
      loadStockInfo(cart.items.map((item) => item.product_id));
    }
  };

  const handleRemoveItem = useCallback(async (orderItemId: string) => {
    setRemovingItemId(orderItemId);
    try {
      await cartService.removeFromCart(orderItemId);
      await loadCart();
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setRemovingItemId(null);
    }
  }, [updateItemCount]);

  const handleRemoveProduct = useCallback(async (productId: number) => {
    if (!cart) return;

    // Find all order_item_ids for this product
    const itemsToRemove = cart.items.filter((item) => item.product_id === productId);
    if (itemsToRemove.length === 0) return;

    setUpdatingProductId(productId);
    try {
      // Remove all items sequentially
      for (const item of itemsToRemove) {
        await cartService.removeFromCart(item.order_item_id);
      }
      await refreshCart();
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to remove product:', error);
    } finally {
      setUpdatingProductId(null);
    }
  }, [cart, updateItemCount]);

  const handleClearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
      setCartState(null);
      setCart(null);
      updateItemCount(0);
      setAppliedVoucher(null);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }, [setCart, updateItemCount]);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;

    setIsApplyingVoucher(true);
    setVoucherError('');
    try {
      const result = await voucherService.applyVoucher(voucherCode);
      setAppliedVoucher(result.voucher);
      setVoucherCode('');
    } catch (error) {
      setVoucherError(error instanceof Error ? error.message : 'Invalid voucher code');
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleRemoveVoucher = async () => {
    try {
      await voucherService.removeVoucher();
      setAppliedVoucher(null);
    } catch (error) {
      console.error('Failed to remove voucher:', error);
    }
  };

  const handleIncrement = useCallback(async (productId: number) => {
    setUpdatingProductId(productId);
    try {
      await cartService.addToCart(productId);
      await refreshCart();
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setUpdatingProductId(null);
    }
  }, [updateItemCount]);

  const handleDecrement = useCallback(async (productId: number) => {
    if (!cart) return;

    // Find one order_item_id for this product
    const itemToRemove = cart.items.find((item) => item.product_id === productId);
    if (!itemToRemove) return;

    setUpdatingProductId(productId);
    try {
      await cartService.removeFromCart(itemToRemove.order_item_id);
      await refreshCart();
      const countResult = await cartService.getCartCount();
      updateItemCount(countResult.count);
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setUpdatingProductId(null);
    }
  }, [cart, updateItemCount]);

  // Count items per product_id
  const getProductQuantity = (productId: number): number => {
    if (!cart) return 0;
    return cart.items.filter((item) => item.product_id === productId).length;
  };

  // Get unique products from cart (grouped by product_id)
  const getUniqueProducts = () => {
    if (!cart) return [];
    const seen = new Set<number>();
    return cart.items.filter((item) => {
      if (seen.has(item.product_id)) return false;
      seen.add(item.product_id);
      return true;
    });
  };

  // Check if a product has stock issues
  const hasStockIssue = (productId: number): boolean => {
    const stock = stockInfo[productId];
    if (!stock || !stock.is_track_stock) return false;
    const quantity = getProductQuantity(productId);
    return stock.available_quantity < quantity;
  };

  // Check if any item in cart has stock issues
  const hasAnyStockIssue = (): boolean => {
    if (!cart || !stockCheckComplete) return false;
    const productIds = [...new Set(cart.items.map((item) => item.product_id))];
    return productIds.some(hasStockIssue);
  };

  // Get items that have stock issues
  const getStockIssueMessage = (productId: number): string | null => {
    const stock = stockInfo[productId];
    if (!stock || !stock.is_track_stock) return null;
    const quantity = getProductQuantity(productId);

    if (stock.stock_status === 'OUT_OF_STOCK') {
      return 'Out of stock';
    }
    if (stock.available_quantity < quantity) {
      return `Only ${stock.available_quantity} available`;
    }
    return null;
  };

  const subtotal = cart?.total_price || 0;
  const discount = appliedVoucher
    ? appliedVoucher.discount_type === 'percentage'
      ? Math.min(
          (subtotal * appliedVoucher.discount_value) / 100,
          appliedVoucher.max_discount_amount || Infinity
        )
      : appliedVoucher.discount_value
    : 0;
  const total = subtotal - discount;

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          {!isAuthenticated ? (
            <UnauthenticatedCart onSignIn={() => openAuthModal('login')} />
          ) : isLoading ? (
            <CartSkeleton />
          ) : !cart || cart.items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <p className="text-muted-foreground">
                      {cart.num_of_item} items in your cart
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={refreshStockInfo}
                      disabled={isStockLoading}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`h-4 w-4 ${isStockLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCart}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cart
                  </Button>
                </div>

                {/* Stock warning banner */}
                {stockCheckComplete && hasAnyStockIssue() && (
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-4">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Some items in your cart have stock availability issues. Please update your cart before checkout.
                    </p>
                  </div>
                )}

                {getUniqueProducts().map((item) => {
                  const itemStock = stockInfo[item.product_id];
                  const stockIssue = getStockIssueMessage(item.product_id);
                  const quantity = getProductQuantity(item.product_id);
                  const isUpdating = updatingProductId === item.product_id;
                  const canIncrement = !itemStock || !itemStock.is_track_stock || itemStock.available_quantity > quantity;

                  return (
                  <Card key={item.product_id} className={stockIssue ? 'border-yellow-300 dark:border-yellow-700' : ''}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                          <Image
                            src={`https://picsum.photos/seed/${item.product_id}/200/200`}
                            alt={item.product_name}
                            fill
                            className={`object-cover ${itemStock?.stock_status === 'OUT_OF_STOCK' ? 'grayscale opacity-50' : ''}`}
                            sizes="96px"
                          />
                          {itemStock?.stock_status === 'OUT_OF_STOCK' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <span className="text-[10px] font-semibold text-white bg-destructive px-1.5 py-0.5 rounded">
                                Out
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <div>
                              <Link
                                href={`/products/${item.product_id}`}
                                className="font-medium hover:text-primary-500 line-clamp-1"
                              >
                                {item.product_name}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                {item.product_brand}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="outline">
                                  {item.department}
                                </Badge>
                                {itemStock && (
                                  <StockIndicator
                                    stock={itemStock}
                                    isLoading={isStockLoading}
                                    size="sm"
                                  />
                                )}
                              </div>
                              {stockIssue && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  {stockIssue}
                                </p>
                              )}
                            </div>
                            <p className="font-semibold text-primary-600 dark:text-primary-400">
                              {formatPrice(item.retail_price * quantity)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleDecrement(item.product_id)}
                                disabled={isUpdating || quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {isUpdating ? (
                                  <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                                ) : (
                                  quantity
                                )}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleIncrement(item.product_id)}
                                disabled={isUpdating || !canIncrement}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatPrice(item.retail_price)} each
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(item.product_id)}
                                disabled={isUpdating}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Voucher Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Promo Code</label>
                      {appliedVoucher ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">
                              {appliedVoucher.voucher_code}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveVoucher}
                            className="text-green-600 hover:text-green-700"
                          >
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter code"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleApplyVoucher()}
                          />
                          <Button
                            onClick={handleApplyVoucher}
                            disabled={isApplyingVoucher}
                          >
                            Apply
                          </Button>
                        </div>
                      )}
                      {voucherError && (
                        <p className="text-sm text-destructive">{voucherError}</p>
                      )}
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      {appliedVoucher && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className="text-green-600">Free</span>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total</span>
                        <span className="text-primary-600 dark:text-primary-400">
                          {formatPrice(total)}
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full gap-2"
                      size="lg"
                      disabled={!stockCheckComplete || hasAnyStockIssue() || isStockLoading}
                      onClick={() => setIsCheckoutModalOpen(true)}
                    >
                      {isStockLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Checking Stock...
                        </>
                      ) : hasAnyStockIssue() ? (
                        <>
                          <AlertTriangle className="h-4 w-4" />
                          Stock Issues
                        </>
                      ) : (
                        'Proceed to Checkout'
                      )}
                    </Button>
                    {hasAnyStockIssue() && (
                      <p className="text-xs text-center text-yellow-600 dark:text-yellow-400">
                        Please remove out-of-stock items before checkout
                      </p>
                    )}

                    <Link href="/products" className="block">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />

      {cart && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cart={cart}
          appliedVoucher={appliedVoucher}
          subtotal={subtotal}
          discount={discount}
          total={total}
        />
      )}
    </div>
  );
}

function UnauthenticatedCart({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Sign in to view your cart</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Please sign in to access your shopping cart, save items, and complete your purchase.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button size="lg" onClick={onSignIn}>
          Sign In
        </Button>
        <Link href="/products">
          <Button size="lg" variant="outline">
            Continue Shopping
          </Button>
        </Link>
      </div>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6">
        Looks like you haven't added anything to your cart yet.
      </p>
      <Link href="/products">
        <Button size="lg">Start Shopping</Button>
      </Link>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
