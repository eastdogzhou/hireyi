/**
 * FormField Component
 * 表单字段容器组件 - 提供标签、错误提示、辅助文本等
 */

import React from 'react'
import { cn } from '../../../lib/utils/cn'
import { AlertCircle } from 'lucide-react'

export interface FormFieldProps {
  /**
   * Field label
   */
  label?: string

  /**
   * Field name/id
   */
  name: string

  /**
   * Error message
   */
  error?: string

  /**
   * Helper text
   */
  helperText?: string

  /**
   * Required field indicator
   */
  required?: boolean

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Field content (input, select, etc.)
   */
  children: React.ReactNode

  /**
   * Custom className for container
   */
  className?: string

  /**
   * Horizontal layout (label on left)
   */
  horizontal?: boolean
}

/**
 * FormField container component
 * Wraps form inputs with label, error messages, and helper text
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  error,
  helperText,
  required = false,
  disabled = false,
  children,
  className,
  horizontal = false,
}) => {
  return (
    <div
      className={cn(
        'space-y-1',
        horizontal && 'flex items-start gap-4',
        disabled && 'opacity-60',
        className
      )}
    >
      {/* Label */}
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium text-gray-700',
            horizontal && 'w-32 pt-2 flex-shrink-0',
            disabled && 'cursor-not-allowed'
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className={cn('flex-1', horizontal ? '' : 'space-y-1')}>
        {children}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-1 text-sm text-red-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    </div>
  )
}

FormField.displayName = 'FormField'
