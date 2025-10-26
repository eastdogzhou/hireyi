/**
 * FormInput Component
 * 集成 React Hook Form 的输入框组件
 */

import React from 'react'
import type { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form'
import { cn } from '../../../lib/utils/cn'
import { FormField } from './FormField'

export interface FormInputProps<T extends FieldValues> {
  /**
   * Field name (must match form schema)
   */
  name: Path<T>

  /**
   * Field label
   */
  label?: string

  /**
   * Input type
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url'

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * React Hook Form register function
   */
  register: UseFormRegister<T>

  /**
   * Field error from React Hook Form
   */
  error?: FieldError

  /**
   * Helper text
   */
  helperText?: string

  /**
   * Required field
   */
  required?: boolean

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Custom className
   */
  className?: string

  /**
   * Additional input props
   */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

/**
 * Form input component integrated with React Hook Form
 */
export function FormInput<T extends FieldValues>({
  name,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
  inputProps,
}: FormInputProps<T>) {
  return (
    <FormField
      label={label}
      name={name}
      error={error?.message}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        {...inputProps}
        className={cn(
          'w-full px-4 py-2 border rounded-lg',
          'text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'transition-colors',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'bg-gray-50 cursor-not-allowed',
          inputProps?.className
        )}
      />
    </FormField>
  )
}

FormInput.displayName = 'FormInput'

/**
 * FormTextArea Component
 * 集成 React Hook Form 的多行文本框
 */
export interface FormTextAreaProps<T extends FieldValues> {
  name: Path<T>
  label?: string
  placeholder?: string
  register: UseFormRegister<T>
  error?: FieldError
  helperText?: string
  required?: boolean
  disabled?: boolean
  rows?: number
  className?: string
  textAreaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>
}

export function FormTextArea<T extends FieldValues>({
  name,
  label,
  placeholder,
  register,
  error,
  helperText,
  required = false,
  disabled = false,
  rows = 4,
  className,
  textAreaProps,
}: FormTextAreaProps<T>) {
  return (
    <FormField
      label={label}
      name={name}
      error={error?.message}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      <textarea
        id={name}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        {...register(name)}
        {...textAreaProps}
        className={cn(
          'w-full px-4 py-2 border rounded-lg',
          'text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          'transition-colors resize-y',
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'bg-gray-50 cursor-not-allowed',
          textAreaProps?.className
        )}
      />
    </FormField>
  )
}

FormTextArea.displayName = 'FormTextArea'
