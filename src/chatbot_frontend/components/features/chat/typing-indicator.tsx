'use client';

import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Avatar fallback="AI" size="sm" />
      <div className="message-bubble message-bubble-assistant">
        <div className="typing-indicator">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}
