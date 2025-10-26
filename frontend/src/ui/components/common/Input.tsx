/**
 * Input Component
 * 输入框组件 - 支持多种输入类型和验证状态
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input variant
   */
  variant?: 'default' | 'filled' | 'flushed';

  /**
   * Input size
   */
  inputSize?: 'sm' | 'md' | 'lg';

  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Icon element to display before input
   */
  icon?: React.ReactNode;

  /**
   * Icon element to display after input
   */
  iconRight?: React.ReactNode;

  /**
   * Label text
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Error message (overrides helperText when state is error)
   */
  errorMessage?: string;

  /**
   * Show required indicator
   */
  showRequired?: boolean;
}

/**
 * Input component for text input
 *
 * @example
 * ```tsx
 * <Input
 *   label="姓名"
 *   placeholder="请输入姓名"
 *   required
 * />
 * ```
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      state = 'default',
      icon,
      iconRight,
      label,
      helperText,
      errorMessage,
      showRequired = false,
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      default:
        'bg-white border border-gray-300 rounded-lg px-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
      filled: 'bg-gray-100 border-2 border-transparent rounded-lg px-3 focus:bg-white focus:border-orange-500',
      flushed:
        'bg-transparent border-0 border-b-2 border-gray-300 rounded-none px-0 focus:border-orange-500',
    };

    const sizeStyles = {
      sm: 'text-sm py-1.5',
      md: 'text-base py-2',
      lg: 'text-lg py-3',
    };

    const stateStyles = {
      default: '',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-100',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-100',
    };

    const iconPaddingStyles = icon ? 'pl-10' : iconRight ? 'pr-10' : '';

    const displayHelperText = state === 'error' && errorMessage ? errorMessage : helperText;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {(required || showRequired) && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[inputSize],
              stateStyles[state],
              iconPaddingStyles,
              className
            )}
            {...props}
          />

          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {iconRight}
            </div>
          )}
        </div>

        {displayHelperText && (
          <p
            className={cn(
              'text-sm mt-1.5',
              state === 'error' ? 'text-red-600' : state === 'success' ? 'text-green-600' : 'text-gray-500'
            )}
          >
            {displayHelperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

/**
 * TextArea Component
 */
export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * TextArea variant
   */
  variant?: 'default' | 'filled';

  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Label text
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Show required indicator
   */
  showRequired?: boolean;

  /**
   * Show character count
   */
  showCount?: boolean;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      className,
      variant = 'default',
      state = 'default',
      label,
      helperText,
      errorMessage,
      showRequired = false,
      showCount = false,
      required,
      disabled,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed resize-vertical';

    const variantStyles = {
      default:
        'bg-white border border-gray-300 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
      filled:
        'bg-gray-100 border-2 border-transparent rounded-lg px-3 py-2 focus:bg-white focus:border-orange-500',
    };

    const stateStyles = {
      default: '',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-100',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-100',
    };

    const displayHelperText = state === 'error' && errorMessage ? errorMessage : helperText;
    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {(required || showRequired) && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          className={cn(baseStyles, variantStyles[variant], stateStyles[state], className)}
          {...props}
        />

        <div className="flex items-start justify-between mt-1.5">
          {displayHelperText && (
            <p
              className={cn(
                'text-sm',
                state === 'error' ? 'text-red-600' : state === 'success' ? 'text-green-600' : 'text-gray-500'
              )}
            >
              {displayHelperText}
            </p>
          )}

          {showCount && maxLength && (
            <p className="text-sm text-gray-500 ml-auto">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

/**
 * Select Component
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Select variant
   */
  variant?: 'default' | 'filled';

  /**
   * Select size
   */
  inputSize?: 'sm' | 'md' | 'lg';

  /**
   * Validation state
   */
  state?: 'default' | 'error' | 'success';

  /**
   * Label text
   */
  label?: string;

  /**
   * Helper text
   */
  helperText?: string;

  /**
   * Error message
   */
  errorMessage?: string;

  /**
   * Show required indicator
   */
  showRequired?: boolean;

  /**
   * Placeholder option text
   */
  placeholder?: string;

  /**
   * Options array
   */
  options?: Array<{ value: string | number; label: string; disabled?: boolean }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      variant = 'default',
      inputSize = 'md',
      state = 'default',
      label,
      helperText,
      errorMessage,
      showRequired = false,
      required,
      disabled,
      placeholder,
      options = [],
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'w-full transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed appearance-none bg-no-repeat bg-right';

    const variantStyles = {
      default:
        'bg-white border border-gray-300 rounded-lg px-3 pr-10 focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
      filled:
        'bg-gray-100 border-2 border-transparent rounded-lg px-3 pr-10 focus:bg-white focus:border-orange-500',
    };

    const sizeStyles = {
      sm: 'text-sm py-1.5',
      md: 'text-base py-2',
      lg: 'text-lg py-3',
    };

    const stateStyles = {
      default: '',
      error: 'border-red-500 focus:border-red-500 focus:ring-red-100',
      success: 'border-green-500 focus:border-green-500 focus:ring-green-100',
    };

    const displayHelperText = state === 'error' && errorMessage ? errorMessage : helperText;

    // SVG chevron icon as background
    const chevronIcon = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
            {(required || showRequired) && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            required={required}
            className={cn(baseStyles, variantStyles[variant], sizeStyles[inputSize], stateStyles[state], className)}
            style={{ backgroundImage: chevronIcon, backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem' }}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
        </div>

        {displayHelperText && (
          <p
            className={cn(
              'text-sm mt-1.5',
              state === 'error' ? 'text-red-600' : state === 'success' ? 'text-green-600' : 'text-gray-500'
            )}
          >
            {displayHelperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Form Field Wrapper - For custom input components
 */
export interface FormFieldProps {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  required?: boolean;
  showRequired?: boolean;
  state?: 'default' | 'error' | 'success';
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  helperText,
  errorMessage,
  required,
  showRequired = false,
  state = 'default',
  children,
  className,
}) => {
  const displayHelperText = state === 'error' && errorMessage ? errorMessage : helperText;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {(required || showRequired) && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {children}

      {displayHelperText && (
        <p
          className={cn(
            'text-sm mt-1.5',
            state === 'error' ? 'text-red-600' : state === 'success' ? 'text-green-600' : 'text-gray-500'
          )}
        >
          {displayHelperText}
        </p>
      )}
    </div>
  );
};

FormField.displayName = 'FormField';

/**
 * Input Group - Group multiple inputs horizontally
 */
export interface InputGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const InputGroup: React.FC<InputGroupProps> = ({ children, className }) => {
  return <div className={cn('flex gap-3', className)}>{children}</div>;
};

InputGroup.displayName = 'InputGroup';
