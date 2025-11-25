/**
 * TagInput Component
 * 标签输入组件 - 用于技能、关键词等标签的输入
 */

import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { UseFormSetValue, UseFormWatch, FieldValues, Path, FieldError } from 'react-hook-form'
import { cn } from '../../../lib/utils/cn'
import { X } from 'lucide-react'
import { FormField } from './FormField'

export interface TagInputProps<T extends FieldValues> {
  /**
   * Field name
   */
  name: Path<T>

  /**
   * Field label
   */
  label?: string

  /**
   * Placeholder text
   */
  placeholder?: string

  /**
   * React Hook Form setValue function
   */
  setValue: UseFormSetValue<T>

  /**
   * React Hook Form watch function
   */
  watch: UseFormWatch<T>

  /**
   * Field error
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
   * Maximum number of tags
   */
  maxTags?: number

  /**
   * Custom className
   */
  className?: string

  /**
   * Tag suggestions for autocomplete
   */
  suggestions?: string[]
}

/**
 * Tag input component for entering multiple tags/skills
 * Press Enter, comma, or tab to add a tag
 */
export function TagInput<T extends FieldValues>({
  name,
  label,
  placeholder = '输入后按 Enter 添加',
  setValue,
  watch,
  error,
  helperText,
  required = false,
  disabled = false,
  maxTags,
  className,
  suggestions = [],
}: TagInputProps<T>) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Get current tags from form state
  const tags = (watch(name) as string[]) || []

  // Filter suggestions based on input
  const filteredSuggestions = suggestions.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion)
  )

  // Add a new tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (!trimmedTag) return
    if (tags.includes(trimmedTag)) return
    if (maxTags && tags.length >= maxTags) return

    setValue(name, [...tags, trimmedTag] as any, { shouldValidate: true })
    setInputValue('')
    setShowSuggestions(false)
  }

  // Remove a tag
  const removeTag = (index: number) => {
    const newTags = tags.filter((_, i) => i !== index)
    setValue(name, newTags as any, { shouldValidate: true })
  }

  // Handle key down
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags.length - 1)
    }
  }

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
      <div className="relative">
        {/* Tags Container */}
        <div
          className={cn(
            'min-h-[42px] w-full px-3 py-2 border rounded-lg',
            'flex flex-wrap gap-2 items-center',
            'focus-within:outline-none focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-transparent',
            'transition-colors',
            error
              ? 'border-red-500 focus-within:ring-red-500'
              : 'border-gray-300 hover:border-gray-400',
            disabled && 'bg-gray-50 cursor-not-allowed'
          )}
        >
          {/* Existing Tags */}
          {tags.map((tag, index) => (
            <div
              key={index}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1',
                'bg-orange-100 text-orange-700 rounded-md text-sm font-medium',
                disabled && 'opacity-60'
              )}
            >
              <span>{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="hover:bg-orange-200 rounded p-0.5 transition-colors"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* Input */}
          {(!maxTags || tags.length < maxTags) && (
            <input
              type="text"
              value={inputValue}
              onChange={e => {
                setInputValue(e.target.value)
                setShowSuggestions(e.target.value.length > 0)
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Add tag on blur if there's input
                if (inputValue.trim()) {
                  addTag(inputValue)
                }
                // Delay hiding suggestions to allow click
                setTimeout(() => setShowSuggestions(false), 200)
              }}
              onFocus={() => {
                if (inputValue.length > 0) {
                  setShowSuggestions(true)
                }
              }}
              placeholder={tags.length === 0 ? placeholder : ''}
              disabled={disabled}
              className={cn(
                'flex-1 min-w-[120px] outline-none bg-transparent',
                'text-gray-900 placeholder-gray-400',
                disabled && 'cursor-not-allowed'
              )}
            />
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addTag(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-orange-50 focus:bg-orange-50 focus:outline-none transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Max tags indicator */}
      {maxTags && (
        <p className="text-xs text-gray-500 mt-1">
          {tags.length} / {maxTags} 标签
        </p>
      )}
    </FormField>
  )
}

TagInput.displayName = 'TagInput'
