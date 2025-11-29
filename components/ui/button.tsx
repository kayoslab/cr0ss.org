import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Reusable Button component with variants, sizes, and accessibility features
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="outline" leftIcon={<Icon />}>With Icon</Button>
 * <Button isLoading>Loading...</Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-semibold rounded-md',
      'transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    ];

    const variantStyles = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700',
        'focus-visible:ring-blue-500',
        'disabled:hover:bg-blue-600',
      ],
      secondary: [
        'bg-gray-600 text-white',
        'hover:bg-gray-700',
        'focus-visible:ring-gray-500',
        'disabled:hover:bg-gray-600',
      ],
      outline: [
        'border-2 border-gray-300 text-gray-700 bg-transparent',
        'hover:bg-gray-50 hover:border-gray-400',
        'focus-visible:ring-gray-500',
        'disabled:hover:bg-transparent disabled:hover:border-gray-300',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100',
        'focus-visible:ring-gray-500',
        'disabled:hover:bg-transparent',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700',
        'focus-visible:ring-red-500',
        'disabled:hover:bg-red-600',
      ],
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!isLoading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
