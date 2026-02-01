'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  MapPin,
  Tag,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header, Footer } from '@/components/layout';
import { ChatWidget } from '@/components/features/chat';
import { orderService } from '@/services/order.service';
import { useAuthStore } from '@/stores/auth-store';
import { formatPrice, formatDateTime, cn } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/api';

const statusConfig: Record<OrderStatus, { icon: typeof Package; color: string; bgColor: string }> = {
  Cart: { icon: Package, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  Processing: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900' },
  Shipped: { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900' },
  Delivered: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
  Complete: { icon: CheckCircle2, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900' },
  Cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900' },
  Returned: { icon: RotateCcw, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadOrder();
    } else if (mounted && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [mounted, isAuthenticated, orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await orderService.getOrderById(orderId);
      setOrder(result);
    } catch (err) {
      console.error('Failed to load order:', err);
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  const StatusIcon = order ? statusConfig[order.status].icon : Package;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => router.push('/orders')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>

          {!isAuthenticated ? (
            <UnauthenticatedView onSignIn={() => openAuthModal('login')} />
          ) : isLoading ? (
            <OrderSkeleton />
          ) : error ? (
            <ErrorView error={error} onRetry={loadOrder} />
          ) : order ? (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Order #{order.order_id}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Placed on {formatDateTime(order.created_at)}
                        </p>
                      </div>
                      <Badge
                        className={cn(
                          'text-sm px-3 py-1',
                          statusConfig[order.status].bgColor,
                          statusConfig[order.status].color
                        )}
                      >
                        <StatusIcon className="h-4 w-4 mr-1" />
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <OrderTimeline order={order} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Items ({order.num_of_item})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <div
                          key={item.order_item_id}
                          className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                        >
                          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                            <Image
                              src={`https://picsum.photos/seed/${item.product_id}/200/200`}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/products/${item.product_id}`}
                              className="font-medium hover:text-primary-500 line-clamp-1"
                            >
                              {item.product_name}
                            </Link>
                            {item.product_brand && (
                              <p className="text-sm text-muted-foreground">
                                {item.product_brand}
                              </p>
                            )}
                            {item.department && (
                              <Badge variant="outline" className="mt-1">
                                {item.department}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary-600 dark:text-primary-400">
                              {formatPrice(item.retail_price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    {order.voucher && order.discount_amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {order.voucher.voucher_code}
                        </span>
                        <span>-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary-600 dark:text-primary-400">
                        {formatPrice(order.total_amount)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {order.shipping_address && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="font-medium">{order.shipping_address.customer_address_label}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {order.shipping_address.street_address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.city}, {order.shipping_address.state}{' '}
                        {order.shipping_address.postal_code}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.country}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The order you're looking for doesn't exist.
              </p>
              <Link href="/orders">
                <Button>View All Orders</Button>
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

function OrderTimeline({ order }: { order: Order }) {
  const steps = [
    { status: 'Processing', label: 'Order Placed', date: order.created_at },
    { status: 'Shipped', label: 'Shipped', date: order.shipped_at },
    { status: 'Delivered', label: 'Delivered', date: order.delivered_at },
  ];

  const currentStepIndex = steps.findIndex((step) => {
    if (order.status === 'Cancelled' || order.status === 'Returned') return false;
    if (step.status === 'Processing' && ['Processing', 'Shipped', 'Delivered', 'Complete'].includes(order.status)) return false;
    if (step.status === 'Shipped' && ['Shipped', 'Delivered', 'Complete'].includes(order.status)) return false;
    if (step.status === 'Delivered' && ['Delivered', 'Complete'].includes(order.status)) return false;
    return true;
  });

  const isCompleted = (index: number) => {
    if (order.status === 'Cancelled' || order.status === 'Returned') return false;
    if (index === 0) return ['Processing', 'Shipped', 'Delivered', 'Complete'].includes(order.status);
    if (index === 1) return ['Shipped', 'Delivered', 'Complete'].includes(order.status);
    if (index === 2) return ['Delivered', 'Complete'].includes(order.status);
    return false;
  };

  if (order.status === 'Cancelled' || order.status === 'Returned') {
    return (
      <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
        {order.status === 'Cancelled' ? (
          <XCircle className="h-6 w-6 text-red-600" />
        ) : (
          <RotateCcw className="h-6 w-6 text-orange-600" />
        )}
        <div>
          <p className="font-medium">{order.status}</p>
          <p className="text-sm text-muted-foreground">
            This order has been {order.status.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step.status} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                isCompleted(index)
                  ? 'bg-green-100 dark:bg-green-900 text-green-600'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted(index) ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            <p
              className={cn(
                'text-sm mt-2 text-center',
                isCompleted(index) ? 'font-medium' : 'text-muted-foreground'
              )}
            >
              {step.label}
            </p>
            {step.date && isCompleted(index) && (
              <p className="text-xs text-muted-foreground mt-1">
                {formatDateTime(step.date)}
              </p>
            )}
          </div>
          {index < steps.length - 1 && (
            <div
              className={cn(
                'flex-1 h-1 mx-2',
                isCompleted(index + 1) ? 'bg-green-500' : 'bg-muted'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function UnauthenticatedView({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-16">
      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h2 className="text-2xl font-semibold mb-2">Sign in to view your order</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Please sign in to access your order details.
      </p>
      <Button size="lg" onClick={onSignIn}>
        Sign In
      </Button>
    </div>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="text-center py-16">
      <XCircle className="h-16 w-16 mx-auto mb-4 text-red-500 opacity-50" />
      <h2 className="text-2xl font-semibold mb-2">Failed to Load Order</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
      <Button onClick={onRetry}>Try Again</Button>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-48" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <Skeleton className="h-4 w-16 mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-20 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
