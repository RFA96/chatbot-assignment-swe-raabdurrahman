'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Lock, User, Eye, EyeOff, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth.service';
import { cn } from '@/lib/utils';

export function AuthModal() {
  const {
    isAuthModalOpen,
    authModalTab,
    closeAuthModal,
    setAuthModalTab,
    setCustomer,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  // Wait for client-side mount before rendering portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset form when modal opens/closes or tab changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setError('');
    }
  }, [isAuthModalOpen, authModalTab]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAuthModal();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeAuthModal]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.login({ email, password });
      setCustomer(response.customer, response.session_id, response.expires_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authService.register({
        customer_name: name,
        email,
        password,
      });
      setCustomer(response.customer, response.session_id, response.expires_at);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthModalOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closeAuthModal}
      />

      {/* Modal Container - untuk centering */}
      <div className="min-h-full flex items-center justify-center p-4">
        {/* Modal */}
        <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Close button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="pt-8 pb-6 px-8 text-center bg-gradient-to-b from-primary-50 to-transparent dark:from-primary-950">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500 flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">
            {authModalTab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {authModalTab === 'login'
              ? 'Sign in to access your cart and orders'
              : 'Join us for exclusive deals and offers'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="px-8">
          <div className="flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setAuthModalTab('login')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                authModalTab === 'login'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModalTab('register')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                authModalTab === 'register'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={authModalTab === 'login' ? handleLogin : handleRegister}
          className="p-8 pt-6 space-y-4"
        >
          {authModalTab === 'register' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                leftIcon={<User className="h-4 w-4" />}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading}
            isLoading={isLoading}
          >
            {authModalTab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

          {authModalTab === 'login' && (
            <p className="text-center text-sm text-muted-foreground">
              <button
                type="button"
                className="text-primary-500 hover:underline"
                onClick={() => {/* TODO: Forgot password */}}
              >
                Forgot your password?
              </button>
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-8 pb-8 text-center text-sm text-muted-foreground">
          {authModalTab === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setAuthModalTab('register')}
                className="text-primary-500 font-medium hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setAuthModalTab('login')}
                className="text-primary-500 font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
