'use client';

import { cn } from '@/lib/utils';
import type { QuickReplyOption } from '@/types/chat';

interface QuickRepliesProps {
  options: QuickReplyOption[];
  onSelect: (option: QuickReplyOption) => void;
  className?: string;
  disabled?: boolean;
}

export function QuickReplies({
  options,
  onSelect,
  className,
  disabled = false,
}: QuickRepliesProps) {
  if (options.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option)}
          disabled={disabled}
          className={cn(
            'quick-reply-btn',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.icon && <span className="mr-1.5">{option.icon}</span>}
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Default quick replies for common actions
export const defaultQuickReplies: QuickReplyOption[] = [
  {
    id: 'browse',
    label: 'Browse Products',
    action: { type: 'send_message', message: 'Show me some products' },
  },
  {
    id: 'cart',
    label: 'View Cart',
    action: { type: 'view_cart' },
  },
  {
    id: 'deals',
    label: 'Current Deals',
    action: { type: 'send_message', message: 'What deals do you have?' },
  },
  {
    id: 'help',
    label: 'Help',
    action: { type: 'send_message', message: 'I need help' },
  },
];
