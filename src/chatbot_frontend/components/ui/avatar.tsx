'use client';

import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Avatar({
  className,
  src,
  alt = 'Avatar',
  fallback,
  size = 'md',
  ...props
}: AvatarProps) {
  const sizes = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
    xl: 'h-12 w-12 text-lg',
  };

  const imageSizes = {
    sm: 24,
    md: 32,
    lg: 40,
    xl: 48,
  };

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted',
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium text-muted-foreground">
          {fallback ? getInitials(fallback) : '?'}
        </span>
      )}
    </div>
  );
}

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  max?: number;
  children: React.ReactNode;
}

function AvatarGroup({ className, max = 4, children, ...props }: AvatarGroupProps) {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {visibleAvatars.map((child, index) => (
        <div
          key={index}
          className="ring-2 ring-background rounded-full"
        >
          {child}
        </div>
      ))}
      {remainingCount > 0 && (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium ring-2 ring-background">
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export { Avatar, AvatarGroup };
