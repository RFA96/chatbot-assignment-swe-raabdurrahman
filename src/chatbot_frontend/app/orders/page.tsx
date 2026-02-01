'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronRight,
  Filter,
  Lock,
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

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Orders' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Complete', label: 'Complete' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Returned', label: 'Returned' },
];

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const { isAuthenticated, openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadOrders = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await orderService.getOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        page_size: pageSize,
      });
      setOrders(result.items);
      setTotalPages(result.total_pages);
      setTotal(result.total);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, statusFilter, page]);

  useEffect(() => {
    if (mounted) {
      loadOrders();
    }
  }, [mounted, loadOrders]);

  const handleFilterChange = (newFilter: OrderStatus | 'all') => {
    setStatusFilter(newFilter);
    setPage(1);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Orders</h1>
              {isAuthenticated && !isLoading && (
                <p className="text-muted-foreground mt-1">
                  {total} {total === 1 ? 'order' : 'orders'} in total
                </p>
              )}
            </div>
          </div>

          {!isAuthenticated ? (
            <UnauthenticatedView onSignIn={() => openAuthModal('login')} />
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                {statusFilters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={statusFilter === filter.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(filter.value)}
                    className="shrink-0"
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <OrdersSkeleton />
              ) : orders.length === 0 ? (
                <EmptyOrders statusFilter={statusFilter} />
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard key={order.order_id} order={order} />
                  ))}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground px-4">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <ChatWidget />
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const StatusIcon = statusConfig[order.status].icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 shrink-0">
            {order.items.slice(0, 3).map((item, index) => (
              <div
                key={item.order_item_id}
                className={cn(
                  'relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-lg bg-muted',
                  index > 0 && 'hidden sm:block'
                )}
              >
                <Image
                  src={`https://picsum.photos/seed/${item.product_id}/200/200`}
                  alt={item.product_name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="hidden sm:flex h-20 w-20 rounded-lg bg-muted items-center justify-center text-sm text-muted-foreground">
                +{order.items.length - 3}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">Order #{order.order_id}</h3>
                  <Badge
                    className={cn(
                      'text-xs',
                      statusConfig[order.status].bgColor,
                      statusConfig[order.status].color
                    )}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              <p className="font-semibold text-primary-600 dark:text-primary-400 shrink-0">
                {formatPrice(order.total_amount)}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {order.items.slice(0, 2).map((item) => (
                <span
                  key={item.order_item_id}
                  className="text-sm text-muted-foreground"
                >
                  {item.product_name}
                  {order.items.indexOf(item) < Math.min(order.items.length, 2) - 1 && ', '}
                </span>
              ))}
              {order.items.length > 2 && (
                <span className="text-sm text-muted-foreground">
                  and {order.items.length - 2} more
                </span>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {order.num_of_item} {order.num_of_item === 1 ? 'item' : 'items'}
              </p>
              <Link href={`/orders/${order.order_id}`}>
                <Button variant="ghost" size="sm" className="gap-1">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UnauthenticatedView({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Lock className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Sign in to view your orders</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Please sign in to access your order history and track your purchases.
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

function EmptyOrders({ statusFilter }: { statusFilter: OrderStatus | 'all' }) {
  return (
    <div className="text-center py-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
        <Package className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">
        {statusFilter === 'all' ? 'No orders yet' : `No ${statusFilter.toLowerCase()} orders`}
      </h2>
      <p className="text-muted-foreground mb-6">
        {statusFilter === 'all'
          ? "You haven't placed any orders yet. Start shopping to see your orders here."
          : `You don't have any orders with "${statusFilter}" status.`}
      </p>
      <Link href="/products">
        <Button size="lg">Start Shopping</Button>
      </Link>
    </div>
  );
}

function OrdersSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="flex gap-2">
                <Skeleton className="h-20 w-20 rounded-lg" />
                <Skeleton className="h-20 w-20 rounded-lg hidden sm:block" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-28" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
