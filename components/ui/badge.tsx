import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable Badge component for labels, tags, and status indicators
 *
 * @example
 * ```tsx
 * <Badge>Default</Badge>
 * <Badge variant="primary">Primary</Badge>
 * <Badge variant="success" size="sm">Active</Badge>
 * ```
 */
export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = [
    'inline-flex items-center justify-center',
    'font-medium rounded-full',
    'transition-colors duration-200',
  ];

  const variantStyles = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    success: 'bg-green-100 text-green-700 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
    danger: 'bg-red-100 text-red-700 hover:bg-red-200',
    outline: 'border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
