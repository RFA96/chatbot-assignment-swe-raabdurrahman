import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-primary-500 text-white border-transparent',
    secondary: 'bg-muted text-muted-foreground border-transparent',
    success: 'bg-green-500 text-white border-transparent',
    warning: 'bg-yellow-500 text-white border-transparent',
    destructive: 'bg-destructive text-destructive-foreground border-transparent',
    outline: 'bg-transparent border-border text-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
