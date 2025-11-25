/**
 * FileUpload Component
 * 文件上传组件 - 支持拖拽上传和点击上传
 */

import React, { useState, useRef } from 'react'
import type { DragEvent } from 'react'
import type { FieldError } from 'react-hook-form'
import { cn } from '../../../lib/utils/cn'
import { Upload, X, FileText, AlertCircle } from 'lucide-react'
import { FormField } from './FormField'

export interface FileUploadProps {
  /**
   * Field name
   */
  name: string

  /**
   * Field label
   */
  label?: string

  /**
   * Accepted file types
   */
  accept?: string

  /**
   * Allow multiple files
   */
  multiple?: boolean

  /**
   * Maximum file size in bytes
   */
  maxSize?: number

  /**
   * Maximum number of files
   */
  maxFiles?: number

  /**
   * Current files
   */
  files?: File[]

  /**
   * Change handler
   */
  onChange?: (files: File[]) => void

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
   * Custom className
   */
  className?: string
}

/**
 * File upload component with drag-and-drop support
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  name,
  label,
  accept = '.pdf',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  maxFiles = multiple ? 10 : 1,
  files = [],
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Validate file
  const validateFile = (file: File): string | null => {
    // Check file type
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim())
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
      const isAccepted = acceptedTypes.some(
        type => type === fileExtension || file.type === type
      )
      if (!isAccepted) {
        return `文件类型不支持: ${file.name}。仅支持 ${accept}`
      }
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return `文件过大: ${file.name}。最大 ${maxSizeMB}MB`
    }

    return null
  }

  // Handle file selection
  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return

    const newFiles = Array.from(selectedFiles)
    const errors: string[] = []

    // Validate each file
    newFiles.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      }
    })

    // Check total number of files
    const totalFiles = files.length + newFiles.filter((_, i) => !errors[i]).length
    if (totalFiles > maxFiles) {
      errors.push(`最多只能上传 ${maxFiles} 个文件`)
      setFileErrors(errors)
      return
    }

    setFileErrors(errors)

    // Add valid files
    const validFiles = newFiles.filter((_, i) => !errors[i])
    if (validFiles.length > 0) {
      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles
      onChange?.(updatedFiles)
    }
  }

  // Handle drag events
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!disabled) {
      handleFiles(e.dataTransfer.files)
    }
  }

  // Handle click to upload
  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click()
    }
  }

  // Remove a file
  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index)
    onChange?.(newFiles)
  }

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <FormField
      label={label}
      name={name}
      error={error?.message || fileErrors[0]}
      helperText={helperText}
      required={required}
      disabled={disabled}
      className={className}
    >
      <div className="space-y-3">
        {/* Upload Area */}
        <div
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8',
            'flex flex-col items-center justify-center',
            'transition-all cursor-pointer',
            isDragging && !disabled
              ? 'border-orange-500 bg-orange-50'
              : error
                ? 'border-red-300 hover:border-red-400'
                : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={e => handleFiles(e.target.files)}
            disabled={disabled}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2 text-center">
            <div
              className={cn(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isDragging ? 'bg-orange-100' : 'bg-gray-100'
              )}
            >
              <Upload
                className={cn('w-6 h-6', isDragging ? 'text-orange-600' : 'text-gray-400')}
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragging ? '释放以上传文件' : '拖拽文件到此处或点击上传'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {accept} • 最大 {(maxSize / (1024 * 1024)).toFixed(0)}MB
                {multiple && ` • 最多 ${maxFiles} 个文件`}
              </p>
            </div>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <FileText className="w-8 h-8 text-orange-600 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      removeFile(index)
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* File Errors */}
        {fileErrors.length > 1 && (
          <div className="space-y-1">
            {fileErrors.slice(1).map((error, index) => (
              <div key={index} className="flex items-center gap-1 text-sm text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </FormField>
  )
}

FileUpload.displayName = 'FileUpload'
