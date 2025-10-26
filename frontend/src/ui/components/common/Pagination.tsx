/**
 * Pagination Component
 * 分页组件 - 用于数据列表分页
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface PaginationProps {
  /**
   * Current page (1-indexed)
   */
  currentPage: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Total number of items
   */
  totalItems?: number;

  /**
   * Items per page
   */
  pageSize?: number;

  /**
   * Callback when page changes
   */
  onPageChange: (page: number) => void;

  /**
   * Show page size selector
   */
  showPageSize?: boolean;

  /**
   * Available page sizes
   */
  pageSizeOptions?: number[];

  /**
   * Callback when page size changes
   */
  onPageSizeChange?: (pageSize: number) => void;

  /**
   * Number of page buttons to show
   */
  siblingCount?: number;

  /**
   * Show total items count
   */
  showTotal?: boolean;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Size variant
   */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Pagination component for list navigation
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={Math.ceil(total / pageSize)}
 *   totalItems={total}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 * />
 * ```
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 20,
  onPageChange,
  showPageSize = false,
  pageSizeOptions = [10, 20, 50, 100],
  onPageSizeChange,
  siblingCount = 1,
  showTotal = true,
  className,
  size = 'md',
}) => {
  // Generate page numbers to display
  const getPageNumbers = (): (number | string)[] => {
    const totalNumbers = siblingCount * 2 + 3; // siblings + first + last + current
    const totalBlocks = totalNumbers + 2; // + 2 ellipsis

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    if (!showLeftEllipsis && showRightEllipsis) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftEllipsis && !showRightEllipsis) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1);
      return [1, '...', ...rightRange];
    }

    const middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
    return [1, '...', ...middleRange, '...', totalPages];
  };

  const pageNumbers = getPageNumbers();

  const sizeConfig = {
    sm: {
      button: 'w-7 h-7 text-xs',
      text: 'text-xs',
      select: 'text-xs py-1 px-2',
    },
    md: {
      button: 'w-9 h-9 text-sm',
      text: 'text-sm',
      select: 'text-sm py-1.5 px-2.5',
    },
    lg: {
      button: 'w-11 h-11 text-base',
      text: 'text-base',
      select: 'text-base py-2 px-3',
    },
  };

  const config = sizeConfig[size];

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap', className)}>
      {/* Total items */}
      {showTotal && totalItems !== undefined && (
        <div className={cn('text-gray-600', config.text)}>
          显示 <span className="font-medium text-gray-900">{startItem}</span> 到{' '}
          <span className="font-medium text-gray-900">{endItem}</span>，共{' '}
          <span className="font-medium text-gray-900">{totalItems}</span> 条
        </div>
      )}

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            'flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            config.button
          )}
          aria-label="Previous page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page numbers */}
        {pageNumbers.map((pageNum, index) => {
          if (pageNum === '...') {
            return (
              <span key={`ellipsis-${index}`} className={cn('px-2 text-gray-400', config.text)}>
                ...
              </span>
            );
          }

          const isActive = pageNum === currentPage;

          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum as number)}
              className={cn(
                'flex items-center justify-center rounded-lg border transition-all',
                config.button,
                isActive
                  ? 'border-orange-500 bg-orange-500 text-white font-medium shadow-orange'
                  : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-700'
              )}
              aria-label={`Go to page ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            'flex items-center justify-center rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
            config.button
          )}
          aria-label="Next page"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Page size selector */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className={cn('text-gray-600', config.text)}>每页</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              'border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-500',
              config.select
            )}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size} 条
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

Pagination.displayName = 'Pagination';

/**
 * Simple Pagination - Minimal pagination with prev/next only
 */
export interface SimplePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SimplePagination: React.FC<SimplePaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
  size = 'md',
}) => {
  const sizeConfig = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-5 py-2.5',
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center gap-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          config
        )}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        上一页
      </button>

      <span className={cn('text-gray-600', config)}>
        第 <span className="font-medium text-gray-900">{currentPage}</span> / {totalPages} 页
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center gap-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          config
        )}
      >
        下一页
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

SimplePagination.displayName = 'SimplePagination';

/**
 * Load More Button - Alternative to pagination
 */
export interface LoadMoreProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  loadedCount?: number;
  totalCount?: number;
  className?: string;
}

export const LoadMore: React.FC<LoadMoreProps> = ({
  hasMore,
  loading,
  onLoadMore,
  loadedCount,
  totalCount,
  className,
}) => {
  if (!hasMore && loadedCount === totalCount) {
    return (
      <div className={cn('text-center py-6 text-gray-500 text-sm', className)}>
        {totalCount ? `已加载全部 ${totalCount} 条数据` : '已加载全部数据'}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-3 py-6', className)}>
      {loadedCount !== undefined && totalCount !== undefined && (
        <p className="text-sm text-gray-600">
          已加载 {loadedCount} / {totalCount} 条
        </p>
      )}

      <button
        onClick={onLoadMore}
        disabled={loading || !hasMore}
        className="px-6 py-2.5 bg-white border-2 border-orange-500 text-orange-500 rounded-full hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {loading ? '加载中...' : hasMore ? '加载更多' : '没有更多了'}
      </button>
    </div>
  );
};

LoadMore.displayName = 'LoadMore';
