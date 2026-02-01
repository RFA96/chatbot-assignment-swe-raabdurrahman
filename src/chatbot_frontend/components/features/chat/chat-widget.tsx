'use client';

import { useState } from 'react';
import { MessageSquare, X, Minimize2, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWindow } from './chat-window';
import { useChat } from '@/hooks/use-chat';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const { isAuthenticated, openAuthModal } = useAuthStore();

  const {
    messages,
    isLoading,
    isTyping,
    suggestedReplies,
    sendMessage,
    handleQuickReply,
    handleAddToCart,
    handleViewProduct,
  } = useChat();

  const handleOpenChat = () => {
    if (isAuthenticated) {
      setIsOpen(!isOpen);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const handleSignIn = () => {
    setIsOpen(false);
    openAuthModal('login');
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
            isMinimized ? 'h-14' : 'h-[600px] max-h-[calc(100vh-8rem)]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary-500 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-sm">ShopBot Assistant</p>
                <p className="text-xs text-white/80">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            isAuthenticated ? (
              <ChatWindow
                messages={messages}
                isTyping={isTyping}
                isLoading={isLoading}
                suggestedReplies={suggestedReplies}
                onSendMessage={sendMessage}
                onAddToCart={handleAddToCart}
                onViewProduct={handleViewProduct}
                onQuickReply={handleQuickReply}
                className="h-[calc(100%-56px)]"
              />
            ) : (
              <div className="h-[calc(100%-56px)] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Lock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sign in to chat</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Please sign in to access our AI shopping assistant and get personalized recommendations.
                </p>
                <Button onClick={handleSignIn} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In to Continue
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* Floating Button */}
      <Button
        onClick={handleOpenChat}
        className={cn(
          'fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110',
          isOpen && 'bg-muted text-muted-foreground hover:bg-muted'
        )}
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageSquare className="h-6 w-6" />
        )}
      </Button>

      {/* Notification badge */}
      {!isOpen && isAuthenticated && messages.length > 0 && (
        <span className="fixed bottom-14 right-4 z-50 h-5 w-5 rounded-full bg-destructive text-white text-xs flex items-center justify-center animate-bounce">
          {messages.length}
        </span>
      )}
    </>
  );
}
