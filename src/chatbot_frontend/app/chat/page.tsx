'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  Trash2,
  ShoppingCart,
  Home,
  MessageSquarePlus,
  History,
  ChevronLeft,
  ChevronRight,
  Loader2,
  LogIn,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { ChatWindow } from '@/components/features/chat/chat-window';
import { ProductDetailModal } from '@/components/features/product/product-detail-modal';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@/hooks/use-chat';
import { useCartStore } from '@/stores/cart-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn, formatDateTime } from '@/lib/utils';
import type { ChatSession } from '@/types/api';

export default function ChatPage() {
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    messages,
    isLoading,
    isTyping,
    suggestedReplies,
    sessionId,
    sessions,
    isLoadingSessions,
    isLoadingHistory,
    isAuthenticated,
    sendMessage,
    handleQuickReply,
    handleAddToCart,
    handleRetry,
    clearMessages,
    startNewSession,
    switchSession,
    loadSessions,
    deleteSession,
  } = useChat();

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const { itemCount } = useCartStore();
  const { openAuthModal } = useAuthStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-open sidebar on desktop when authenticated and has sessions
  useEffect(() => {
    if (isAuthenticated && sessions.length > 0 && window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }
  }, [isAuthenticated, sessions.length]);

  const onViewProduct = (productId: number) => {
    setSelectedProductId(productId);
    setIsProductModalOpen(true);
  };

  const closeProductModal = () => {
    setIsProductModalOpen(false);
    setSelectedProductId(null);
  };

  const handleNewChat = () => {
    startNewSession();
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = async (session: ChatSession) => {
    await switchSession(session);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, targetSessionId: string) => {
    e.stopPropagation(); // Prevent selecting the session when clicking delete

    if (!confirm('Are you sure you want to delete this chat session? This action cannot be undone.')) {
      return;
    }

    setDeletingSessionId(targetSessionId);
    await deleteSession(targetSessionId);
    setDeletingSessionId(null);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Sidebar - Chat History */}
      {isAuthenticated && (
        <>
          {/* Sidebar Overlay for mobile */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Collapsed Sidebar Toggle - Desktop Only */}
          {!sidebarOpen && (
            <div className="hidden lg:flex flex-col items-center py-4 px-1 border-r border-border bg-card">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                title="Open Chat History"
                className="h-10 w-10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNewChat}
                title="New Chat"
                className="h-10 w-10 mt-2"
              >
                <MessageSquarePlus className="h-5 w-5" />
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="icon"
                onClick={loadSessions}
                disabled={isLoadingSessions}
                title="Refresh History"
                className="h-10 w-10"
              >
                {isLoadingSessions ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <History className="h-5 w-5" />
                )}
              </Button>
            </div>
          )}

          {/* Sidebar */}
          <aside
            className={cn(
              'fixed lg:relative inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-all duration-300',
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:hidden'
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-border min-w-[288px]">
              <h2 className="font-semibold flex items-center gap-2">
                <History className="h-4 w-4" />
                Chat History
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* New Chat Button */}
            <div className="p-3 border-b border-border">
              <Button
                onClick={handleNewChat}
                className="w-full justify-start gap-2"
                variant="outline"
              >
                <MessageSquarePlus className="h-4 w-4" />
                New Chat
              </Button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 px-4 text-muted-foreground text-sm">
                  No chat history yet. Start a conversation!
                </div>
              ) : (
                <div className="py-2">
                  {sessions.map((session) => (
                    <div
                      key={session.session_id}
                      className={cn(
                        'group flex items-center px-4 py-3 hover:bg-accent/50 transition-colors border-l-2 cursor-pointer',
                        session.session_id === sessionId
                          ? 'bg-accent border-primary-500'
                          : 'border-transparent'
                      )}
                      onClick={() => handleSelectSession(session)}
                    >
                      <MessageSquarePlus className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1 ml-2">
                        <p className="text-sm font-medium truncate">
                          Chat Session
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(session.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        onClick={(e) => handleDeleteSession(e, session.session_id)}
                        disabled={deletingSessionId === session.session_id}
                        title="Delete session"
                      >
                        {deletingSessionId === session.session_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Refresh Button */}
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSessions}
                disabled={isLoadingSessions}
                className="w-full text-muted-foreground"
              >
                {isLoadingSessions ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <History className="h-4 w-4 mr-2" />
                )}
                Refresh History
              </Button>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-border bg-card shrink-0">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Link href="/">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>

              {/* ShopBot Logo */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-sm">ShopBot</span>
                  <p className="text-xs text-muted-foreground">AI Shopping Assistant</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Chat History Toggle */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  title="Chat History"
                  className={cn(sidebarOpen && 'bg-accent')}
                >
                  <History className="h-5 w-5" />
                </Button>
              )}

              {/* New Chat */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  title="New Chat"
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              )}

              {/* Clear chat */}
              {isAuthenticated && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-destructive"
                  title="Clear Chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}

              {/* Home */}
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>

              {/* Cart indicator */}
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <Badge
                      className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      variant="destructive"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Loading History Overlay */}
        {isLoadingHistory && (
          <div className="absolute inset-0 bg-background/80 z-30 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
              <p className="text-sm text-muted-foreground">Loading chat history...</p>
            </div>
          </div>
        )}

        {/* Login Required Screen */}
        {!isAuthenticated ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Login Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to use the AI Shopping Assistant. Your chat history will be saved and you can continue conversations anytime.
              </p>
              <div className="space-y-3">
                <Button
                  size="lg"
                  onClick={() => openAuthModal('login')}
                  className="w-full max-w-xs"
                >
                  <LogIn className="h-5 w-5 mr-2" />
                  Sign In to Chat
                </Button>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => openAuthModal('register')}
                    className="text-primary-500 font-medium hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Chat Area */
          <ChatWindow
            messages={messages}
            isTyping={isTyping}
            isLoading={isLoading}
            suggestedReplies={suggestedReplies}
            onSendMessage={sendMessage}
            onAddToCart={handleAddToCart}
            onViewProduct={onViewProduct}
            onQuickReply={handleQuickReply}
            onRetry={handleRetry}
            className="flex-1 min-h-0"
          />
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        productId={selectedProductId}
        isOpen={isProductModalOpen}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
