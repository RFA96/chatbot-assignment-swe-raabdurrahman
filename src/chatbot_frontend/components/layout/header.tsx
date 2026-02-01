'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  ShoppingCart,
  User,
  Menu,
  X,
  MessageSquare,
  Heart,
  LogOut,
  Package,
  Settings,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AuthModal } from '@/components/features/auth';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { authService } from '@/services/auth.service';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/deals', label: 'Deals' },
];

export function Header() {
  const pathname = usePathname();
  const { itemCount } = useCartStore();
  const { isAuthenticated, customer, openAuthModal, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserClick = () => {
    if (isAuthenticated) {
      setUserMenuOpen(!userMenuOpen);
    } else {
      openAuthModal('login');
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Sign Out',
      text: 'Are you sure you want to sign out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#55b15f',
      cancelButtonColor: '#6b7280',
      background: 'hsl(var(--card))',
      color: 'hsl(var(--foreground))',
      customClass: {
        popup: 'rounded-2xl border border-border',
        title: 'text-foreground',
        htmlContainer: 'text-muted-foreground',
        confirmButton: 'rounded-lg px-4 py-2',
        cancelButton: 'rounded-lg px-4 py-2',
      },
    });

    if (result.isConfirmed) {
      try {
        // Call logout API and clear localStorage
        await authService.logout();
      } catch (error) {
        console.error('Logout API error:', error);
        // Still clear storage even if API fails
        authService.clearStorageOnLogout();
      }
      // Clear auth state
      clearAuth();
      setUserMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar - Promo */}
      <div className="bg-primary-500 text-white text-center py-2 text-sm">
        Free shipping on orders over $50! Use code: <strong>FREESHIP</strong>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block">ShopBot</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-500',
                  pathname === link.href
                    ? 'text-primary-500'
                    : 'text-muted-foreground'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Chat */}
            <Link href="/chat">
              <Button variant="ghost" size="icon" className="relative">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </Link>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Heart className="h-5 w-5" />
            </Button>

            {/* Cart */}
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {mounted && itemCount > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                    variant="destructive"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User */}
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleUserClick}
                className="relative"
              >
                {mounted && isAuthenticated ? (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                    {customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </Button>

              {/* User dropdown menu */}
              {mounted && userMenuOpen && isAuthenticated && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-card border border-border shadow-xl overflow-hidden animate-fade-in">
                  {/* User info header */}
                  <div className="px-4 py-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold">
                        {customer?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{customer?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{customer?.email || 'No email'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-2">
                    <Link
                      href="/orders"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Package className="h-4 w-4 text-muted-foreground" />
                      My Orders
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Settings
                    </Link>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-border py-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  pathname === link.href
                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-500'
                    : 'hover:bg-muted'
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <Link
                href="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                  pathname === '/orders'
                    ? 'bg-primary-50 dark:bg-primary-950 text-primary-500'
                    : 'hover:bg-muted'
                )}
              >
                <Package className="h-4 w-4" />
                My Orders
              </Link>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal('login');
                }}
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted text-left"
              >
                Sign In / Register
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal />
    </header>
  );
}
