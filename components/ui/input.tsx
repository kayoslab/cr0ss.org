import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /**
   * Visual variant of the input
   */
  variant?: 'default' | 'error';
  /**
   * Size of the input
   */
  inputSize?: 'sm' | 'md' | 'lg';
  /**
   * Icon or element to display on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon or element to display on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * Error message to display below the input
   */
  error?: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * Label for the input
   */
  label?: string;
}

/**
 * Reusable Input component with variants, icons, and accessibility features
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input variant="error" error="This field is required" />
 * <Input leftIcon={<SearchIcon />} placeholder="Search..." />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = 'default',
      inputSize = 'md',
      leftIcon,
      rightIcon,
      error,
      helperText,
      label,
      className,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    const baseStyles = [
      'w-full rounded-md border',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
      'placeholder:text-gray-400',
    ];

    const variantStyles = {
      default: [
        'border-gray-300 bg-white text-gray-900',
        'focus:border-blue-500 focus:ring-blue-500',
      ],
      error: [
        'border-red-300 bg-white text-gray-900',
        'focus:border-red-500 focus:ring-red-500',
      ],
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const paddingWithIcons = {
      left: {
        sm: 'pl-9',
        md: 'pl-10',
        lg: 'pl-12',
      },
      right: {
        sm: 'pr-9',
        md: 'pr-10',
        lg: 'pr-12',
      },
    };

    const iconSizes = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const iconPositions = {
      left: {
        sm: 'left-3',
        md: 'left-3',
        lg: 'left-3',
      },
      right: {
        sm: 'right-3',
        md: 'right-3',
        lg: 'right-3',
      },
    };

    const inputClasses = cn(
      baseStyles,
      variantStyles[error ? 'error' : variant],
      sizeStyles[inputSize],
      leftIcon && paddingWithIcons.left[inputSize],
      rightIcon && paddingWithIcons.right[inputSize],
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
                iconPositions.left[inputSize]
              )}
              aria-hidden="true"
            >
              <div className={iconSizes[inputSize]}>{leftIcon}</div>
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={inputClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(errorId, helperId)}
            {...props}
          />

          {rightIcon && (
            <div
              className={cn(
                'absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none',
                iconPositions.right[inputSize]
              )}
              aria-hidden="true"
            >
              <div className={iconSizes[inputSize]}>{rightIcon}</div>
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
