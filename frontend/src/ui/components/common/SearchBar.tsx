/**
 * SearchBar Component
 * 搜索框组件 - 用于列表搜索和筛选
 */

import React, { useState } from 'react';
import { cn } from '../../../lib/utils/cn';
import { Button } from './Button';

export interface SearchBarProps {
  /**
   * Search value
   */
  value?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Search callback
   */
  onSearch?: (value: string) => void;

  /**
   * Change callback
   */
  onChange?: (value: string) => void;

  /**
   * Clear callback
   */
  onClear?: () => void;

  /**
   * Show search button
   */
  showSearchButton?: boolean;

  /**
   * Show clear button
   */
  showClearButton?: boolean;

  /**
   * Search on enter
   */
  searchOnEnter?: boolean;

  /**
   * Search on change (debounced)
   */
  searchOnChange?: boolean;

  /**
   * Debounce delay (ms)
   */
  debounceDelay?: number;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * SearchBar component for searching and filtering
 *
 * @example
 * ```tsx
 * <SearchBar
 *   placeholder="搜索候选人姓名、邮箱..."
 *   onSearch={handleSearch}
 *   showSearchButton
 * />
 * ```
 */
export const SearchBar: React.FC<SearchBarProps> = ({
  value: controlledValue,
  placeholder = '搜索...',
  onSearch,
  onChange,
  onClear,
  showSearchButton = true,
  showClearButton = true,
  searchOnEnter = true,
  searchOnChange = false,
  debounceDelay = 300,
  size = 'md',
  loading = false,
  className,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }

    onChange?.(newValue);

    // Debounced search on change
    if (searchOnChange && onSearch) {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      const timer = setTimeout(() => {
        onSearch(newValue);
      }, debounceDelay);

      setDebounceTimer(timer);
    }
  };

  const handleSearch = () => {
    onSearch?.(value);
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onClear?.();
    onSearch?.('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchOnEnter) {
      handleSearch();
    }
  };

  const sizeConfig = {
    sm: {
      input: 'text-sm py-1.5 pl-9 pr-3',
      icon: 'w-4 h-4 left-3',
      button: 'sm' as const,
    },
    md: {
      input: 'text-base py-2 pl-10 pr-3',
      icon: 'w-5 h-5 left-3',
      button: 'md' as const,
    },
    lg: {
      input: 'text-lg py-3 pl-12 pr-4',
      icon: 'w-6 h-6 left-3',
      button: 'lg' as const,
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Search input */}
      <div className="relative flex-1">
        {/* Search icon */}
        <div className={cn('absolute top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none', config.icon)}>
          {loading ? (
            <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'w-full bg-white border border-gray-300 rounded-full transition-all focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100',
            config.input,
            showClearButton && value && 'pr-10'
          )}
        />

        {/* Clear button */}
        {showClearButton && value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search button */}
      {showSearchButton && (
        <Button variant="primary" size={config.button} onClick={handleSearch} disabled={loading}>
          搜索
        </Button>
      )}
    </div>
  );
};

SearchBar.displayName = 'SearchBar';

/**
 * Advanced Search Bar - With filter panel
 */
export interface AdvancedSearchBarProps extends SearchBarProps {
  /**
   * Show filter button
   */
  showFilterButton?: boolean;

  /**
   * Filter panel open state
   */
  filterOpen?: boolean;

  /**
   * Filter panel toggle callback
   */
  onFilterToggle?: (open: boolean) => void;

  /**
   * Filter panel content
   */
  filterContent?: React.ReactNode;

  /**
   * Active filter count
   */
  filterCount?: number;
}

export const AdvancedSearchBar: React.FC<AdvancedSearchBarProps> = ({
  showFilterButton = true,
  filterOpen = false,
  onFilterToggle,
  filterContent,
  filterCount = 0,
  ...searchBarProps
}) => {
  return (
    <div className="space-y-3">
      {/* Search bar with filter button */}
      <div className="flex items-center gap-2">
        <SearchBar {...searchBarProps} className="flex-1" />

        {showFilterButton && (
          <Button
            variant={filterOpen ? 'primary' : 'secondary'}
            size={searchBarProps.size || 'md'}
            onClick={() => onFilterToggle?.(!filterOpen)}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            }
          >
            筛选{filterCount > 0 && ` (${filterCount})`}
          </Button>
        )}
      </div>

      {/* Filter panel */}
      {filterOpen && filterContent && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-fade-in-up">
          {filterContent}
        </div>
      )}
    </div>
  );
};

AdvancedSearchBar.displayName = 'AdvancedSearchBar';

/**
 * Search with Tags - Display active search tags
 */
export interface SearchTag {
  key: string;
  label: string;
  value: string;
  onRemove?: () => void;
}

export interface SearchWithTagsProps extends SearchBarProps {
  /**
   * Active search tags
   */
  tags?: SearchTag[];

  /**
   * Clear all tags callback
   */
  onClearAll?: () => void;
}

export const SearchWithTags: React.FC<SearchWithTagsProps> = ({ tags = [], onClearAll, ...searchBarProps }) => {
  return (
    <div className="space-y-2">
      <SearchBar {...searchBarProps} />

      {/* Active tags */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">已选筛选:</span>

          {tags.map((tag) => (
            <span
              key={tag.key}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
            >
              <span>
                {tag.label}: {tag.value}
              </span>
              {tag.onRemove && (
                <button
                  onClick={tag.onRemove}
                  className="hover:text-orange-900 transition-colors"
                  aria-label={`Remove ${tag.label}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {onClearAll && (
            <button onClick={onClearAll} className="text-sm text-orange-500 hover:text-orange-600 transition-colors">
              清除全部
            </button>
          )}
        </div>
      )}
    </div>
  );
};

SearchWithTags.displayName = 'SearchWithTags';
