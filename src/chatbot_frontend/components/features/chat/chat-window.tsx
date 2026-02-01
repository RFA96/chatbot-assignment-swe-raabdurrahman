'use client';

import { useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { QuickReplies, defaultQuickReplies } from './quick-replies';
import { TypingIndicator } from './typing-indicator';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, QuickReplyOption } from '@/types/chat';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isTyping?: boolean;
  isLoading?: boolean;
  suggestedReplies?: QuickReplyOption[];
  onSendMessage: (message: string) => void;
  onAddToCart?: (productId: number) => void;
  onViewProduct?: (productId: number) => void;
  onQuickReply?: (option: QuickReplyOption) => void;
  onRetry?: () => void;
  className?: string;
}

export function ChatWindow({
  messages,
  isTyping = false,
  isLoading = false,
  suggestedReplies = defaultQuickReplies,
  onSendMessage,
  onAddToCart,
  onViewProduct,
  onQuickReply,
  onRetry,
  className,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleQuickReply = (option: QuickReplyOption) => {
    if (option.action.type === 'send_message') {
      onSendMessage(option.action.message);
    } else {
      onQuickReply?.(option);
    }
  };

  return (
    <div className={cn('chat-container', className)}>
      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="chat-messages"
      >
        {messages.length === 0 ? (
          <EmptyState onQuickReply={handleQuickReply} />
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onAddToCart={onAddToCart}
                onViewProduct={onViewProduct}
                onQuickReply={handleQuickReply}
                onRetry={onRetry}
              />
            ))}

            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {suggestedReplies.length > 0 && messages.length > 0 && !isTyping && (
        <div className="px-4 pb-2">
          <QuickReplies
            options={suggestedReplies}
            onSelect={handleQuickReply}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Input Area */}
      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading || isTyping}
        placeholder={isTyping ? 'AI is typing...' : 'Ask me anything about our products...'}
      />
    </div>
  );
}

interface EmptyStateProps {
  onQuickReply: (option: QuickReplyOption) => void;
}

function EmptyState({ onQuickReply }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center mb-4">
        <MessageSquare className="h-8 w-8 text-primary-500" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Welcome to ShopBot!</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        I'm your AI shopping assistant. I can help you find products, manage your cart,
        apply discounts, and answer questions about our store.
      </p>
      <div className="space-y-3 w-full max-w-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Try one of these:
        </p>
        <QuickReplies
          options={defaultQuickReplies}
          onSelect={onQuickReply}
          className="justify-center"
        />
      </div>
    </div>
  );
}
