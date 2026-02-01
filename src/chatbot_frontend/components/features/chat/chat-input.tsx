'use client';

import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';
import { Send, Paperclip, Mic, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...',
  className,
}: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('chat-input-area', className)}
    >
      <div className="flex items-end gap-2">
        {/* Additional actions */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground"
            disabled={disabled}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </div>

        {/* Text input */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-input bg-background px-4 py-3 pr-12 text-sm',
              'placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'scrollbar-hide'
            )}
          />

          {/* Emoji button inside input */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </Button>
        </div>

        {/* Send / Voice button */}
        {value.trim() ? (
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            disabled={disabled}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shrink-0"
            disabled={disabled}
          >
            <Mic className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Hint text */}
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
}
