import React from 'react';
import { cn } from '@/utils/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary-100 text-primary-700',
  success: 'bg-accent-100 text-accent-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-700',
  info: 'bg-blue-50 text-blue-600',
  neutral: 'bg-gray-100 text-gray-600',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className, dot }) => (
  <span className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
    variantClasses[variant],
    className
  )}>
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', {
      'bg-primary-500': variant === 'default',
      'bg-accent-500': variant === 'success',
      'bg-warning-500': variant === 'warning',
      'bg-danger-500': variant === 'danger',
      'bg-blue-500': variant === 'info',
      'bg-gray-400': variant === 'neutral',
    })} />}
    {children}
  </span>
);
