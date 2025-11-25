/**
 * SelectDropdown Component
 * 高级下拉选择框组件 - 支持单选、多选、搜索、清除等功能
 * 注: 对于简单的原生 select，请使用 Input.tsx 中的 Select 组件
 */

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '../../../lib/utils/cn'
import { ChevronDown, Check, X } from 'lucide-react'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface SelectDropdownProps {
  /**
   * Select options
   */
  options: SelectOption[]

  /**
   * Selected value (for single select)
   */
  value?: string | number

  /**
   * Selected values (for multiple select)
   */
  values?: (string | number)[]

  /**
   * Multiple selection mode
   */
  multiple?: boolean

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * Disabled state
   */
  disabled?: boolean

  /**
   * Error state
   */
  error?: boolean

  /**
   * Full width
   */
  fullWidth?: boolean

  /**
   * Allow search/filter options
   */
  searchable?: boolean

  /**
   * Allow clear selection
   */
  clearable?: boolean

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Change handler
   */
  onChange?: (value: string | number | (string | number)[]) => void

  /**
   * Custom className
   */
  className?: string
}

export const SelectDropdown: React.FC<SelectDropdownProps> = ({
  options,
  value,
  values,
  multiple = false,
  placeholder = '请选择',
  disabled = false,
  error = false,
  fullWidth = false,
  searchable = false,
  clearable = false,
  size = 'md',
  onChange,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get selected option(s) label
  const getSelectedLabel = (): string => {
    if (multiple && values) {
      if (values.length === 0) return placeholder
      if (values.length === 1) {
        const option = options.find(opt => opt.value === values[0])
        return option?.label || placeholder
      }
      return `已选择 ${values.length} 项`
    } else if (value !== undefined) {
      const option = options.find(opt => opt.value === value)
      return option?.label || placeholder
    }
    return placeholder
  }

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options

  // Handle option selection
  const handleSelect = (optionValue: string | number) => {
    if (multiple) {
      const currentValues = values || []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange?.(newValues)
    } else {
      onChange?.(optionValue)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  // Handle clear selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiple) {
      onChange?.([])
    } else {
      onChange?.('' as any)
    }
  }

  // Check if option is selected
  const isSelected = (optionValue: string | number): boolean => {
    if (multiple) {
      return (values || []).includes(optionValue)
    }
    return value === optionValue
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input when opening if searchable
  useEffect(() => {
    if (isOpen && searchable && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, searchable])

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-4 py-3',
  }

  const hasValue = multiple ? (values || []).length > 0 : value !== undefined && value !== ''

  return (
    <div
      ref={containerRef}
      className={cn('relative', fullWidth ? 'w-full' : 'w-auto', className)}
    >
      {/* Select Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-between w-full rounded-lg border bg-white transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent',
          sizeStyles[size],
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed bg-gray-50',
          isOpen && 'border-orange-500 ring-2 ring-orange-500'
        )}
      >
        <span
          className={cn(
            'flex-1 text-left truncate',
            !hasValue && 'text-gray-400'
          )}
        >
          {getSelectedLabel()}
        </span>

        <div className="flex items-center gap-1 ml-2">
          {clearable && hasValue && !disabled && (
            <X
              className="w-4 h-4 text-gray-400 hover:text-gray-600"
              onClick={handleClear}
            />
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg',
            'max-h-60 overflow-y-auto'
          )}
        >
          {/* Search Input */}
          {searchable && (
            <div className="sticky top-0 bg-white border-b border-gray-200 p-2">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="搜索..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                无匹配选项
              </div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-2 text-left transition-colors',
                    'hover:bg-orange-50 focus:bg-orange-50 focus:outline-none',
                    isSelected(option.value) && 'bg-orange-50 text-orange-600 font-medium',
                    option.disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected(option.value) && (
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

SelectDropdown.displayName = 'SelectDropdown'
