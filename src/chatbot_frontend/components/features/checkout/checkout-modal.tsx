'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  MapPin,
  CheckCircle2,
  Loader2,
  ShoppingBag,
  Tag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { addressService, orderService } from '@/services/order.service';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice, cn } from '@/lib/utils';
import type { CustomerAddress, Cart, Voucher, Order } from '@/types/api';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  appliedVoucher: Voucher | null;
  subtotal: number;
  discount: number;
  total: number;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  appliedVoucher,
  subtotal,
  discount,
  total,
}: CheckoutModalProps) {
  const router = useRouter();
  const { setCart, updateItemCount } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadAddresses = useCallback(async () => {
    setIsLoadingAddresses(true);
    try {
      const result = await addressService.getAddresses();
      setAddresses(result.items);
      if (result.items.length > 0) {
        setSelectedAddressId(result.items[0].customer_address_id);
      }
    } catch (err) {
      console.error('Failed to load addresses:', err);
      setError('Failed to load addresses. Please try again.');
    } finally {
      setIsLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      setError('');
      setCheckoutSuccess(false);
      setCompletedOrder(null);
    }
  }, [isOpen, loadAddresses]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, isProcessing]);

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const result = await orderService.checkout({
        shipping_address_id: selectedAddressId,
        voucher_code: appliedVoucher?.voucher_code,
      });

      setCompletedOrder(result.order);
      setCheckoutSuccess(true);
      setCart(null);
      updateItemCount(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewOrder = () => {
    if (completedOrder) {
      router.push(`/orders/${completedOrder.order_id}`);
    } else {
      router.push('/orders');
    }
    onClose();
  };

  const handleContinueShopping = () => {
    router.push('/products');
    onClose();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => !isProcessing && onClose()}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {!isProcessing && !checkoutSuccess && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>
          )}

          {checkoutSuccess ? (
            <SuccessView
              order={completedOrder!}
              onViewOrder={handleViewOrder}
              onContinueShopping={handleContinueShopping}
            />
          ) : (
            <>
              <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-950">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold">Checkout</h2>
                <p className="text-muted-foreground mt-1">
                  Select your shipping address to complete your order
                </p>
              </div>

              <div className="px-8 pb-6">
                <h3 className="text-sm font-medium mb-3">Shipping Address</h3>

                {isLoadingAddresses ? (
                  <AddressSkeleton />
                ) : addresses.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No saved addresses found</p>
                    <p className="text-sm mt-1">Please add an address in your profile</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {addresses.map((address) => (
                      <Card
                        key={address.customer_address_id}
                        className={cn(
                          'cursor-pointer transition-all hover:border-primary-300',
                          selectedAddressId === address.customer_address_id
                            ? 'border-primary-500 ring-2 ring-primary-500/20'
                            : 'border-border'
                        )}
                        onClick={() => setSelectedAddressId(address.customer_address_id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                                selectedAddressId === address.customer_address_id
                                  ? 'border-primary-500 bg-primary-500'
                                  : 'border-muted-foreground/30'
                              )}
                            >
                              {selectedAddressId === address.customer_address_id && (
                                <CheckCircle2 className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">
                                {address.customer_address_label}
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {address.street_address}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-8 pb-6 border-t border-border pt-4">
                <h3 className="text-sm font-medium mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Items ({cart.num_of_item})
                    </span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {appliedVoucher && (
                    <div className="flex justify-between text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3" />
                        {appliedVoucher.voucher_code}
                      </span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="px-8 pb-4">
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                </div>
              )}

              <div className="px-8 pb-8">
                <Button
                  onClick={handleCheckout}
                  className="w-full"
                  size="lg"
                  disabled={isProcessing || isLoadingAddresses || addresses.length === 0}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

function SuccessView({
  order,
  onViewOrder,
  onContinueShopping,
}: {
  order: Order;
  onViewOrder: () => void;
  onContinueShopping: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
      <p className="text-muted-foreground mb-6">
        Thank you for your order. Your order #{order.order_id} has been confirmed.
      </p>

      <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Order ID</span>
            <span className="font-medium">#{order.order_id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="font-medium text-yellow-600">{order.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items</span>
            <span className="font-medium">{order.num_of_item}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold text-primary-600 dark:text-primary-400">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button onClick={onViewOrder} className="w-full" size="lg">
          View Order Details
        </Button>
        <Button onClick={onContinueShopping} variant="outline" className="w-full">
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}

function AddressSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Skeleton className="w-5 h-5 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
