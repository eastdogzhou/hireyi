/**
 * Loading Component
 * 加载状态组件 - 用于显示加载中状态
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface LoadingSpinnerProps {
  /**
   * Spinner size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Spinner color
   */
  color?: 'primary' | 'white' | 'gray';

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Loading Spinner - Circular loading indicator
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="md" color="primary" />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className,
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorStyles = {
    primary: 'text-orange-500',
    white: 'text-white',
    gray: 'text-gray-400',
  };

  return (
    <svg
      className={cn('animate-spin', sizeStyles[size], colorStyles[color], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Loading Dots - Three dots loading indicator
 */
export interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ size = 'md', color = 'primary', className }) => {
  const dotSizeStyles = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const colorStyles = {
    primary: 'bg-orange-500',
    white: 'bg-white',
    gray: 'bg-gray-400',
  };

  const gapStyles = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  };

  return (
    <div className={cn('flex items-center', gapStyles[size], className)} role="status" aria-label="Loading">
      <span
        className={cn('rounded-full animate-bounce', dotSizeStyles[size], colorStyles[color])}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={cn('rounded-full animate-bounce', dotSizeStyles[size], colorStyles[color])}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={cn('rounded-full animate-bounce', dotSizeStyles[size], colorStyles[color])}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

LoadingDots.displayName = 'LoadingDots';

/**
 * Loading Overlay - Full screen loading overlay
 */
export interface LoadingOverlayProps {
  /**
   * Show overlay
   */
  show: boolean;

  /**
   * Loading message
   */
  message?: string;

  /**
   * Spinner size
   */
  size?: 'md' | 'lg' | 'xl';

  /**
   * Background opacity
   */
  opacity?: 'light' | 'medium' | 'dark';
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  show,
  message,
  size = 'lg',
  opacity = 'medium',
}) => {
  if (!show) return null;

  const opacityStyles = {
    light: 'bg-white/60 backdrop-blur-sm',
    medium: 'bg-white/80 backdrop-blur-md',
    dark: 'bg-white/95 backdrop-blur-lg',
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center',
        opacityStyles[opacity]
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Loading"
    >
      <LoadingSpinner size={size} color="primary" />
      {message && <p className="mt-4 text-gray-700 font-medium">{message}</p>}
    </div>
  );
};

LoadingOverlay.displayName = 'LoadingOverlay';

/**
 * Skeleton - Placeholder loading state
 */
export interface SkeletonProps {
  /**
   * Skeleton variant
   */
  variant?: 'text' | 'circular' | 'rectangular';

  /**
   * Width (CSS value or percentage)
   */
  width?: string | number;

  /**
   * Height (CSS value)
   */
  height?: string | number;

  /**
   * Animation type
   */
  animation?: 'pulse' | 'wave' | 'none';

  /**
   * Additional CSS class
   */
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  className,
}) => {
  const variantStyles = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width !== undefined) {
    style.width = typeof width === 'number' ? `${width}px` : width;
  }
  if (height !== undefined) {
    style.height = typeof height === 'number' ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        'bg-gray-200',
        variantStyles[variant],
        animationStyles[animation],
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
};

Skeleton.displayName = 'Skeleton';

/**
 * Card Skeleton - Skeleton for card loading
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-4', className)}>
      <div className="flex items-center mb-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="ml-3 flex-1">
          <Skeleton variant="text" height={20} width="60%" className="mb-2" />
          <Skeleton variant="text" height={16} width="40%" />
        </div>
      </div>
      <Skeleton variant="rectangular" height={100} className="mb-3" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height={32} width={80} />
        <Skeleton variant="rectangular" height={32} width={80} />
      </div>
    </div>
  );
};

CardSkeleton.displayName = 'CardSkeleton';

/**
 * Table Skeleton - Skeleton for table loading
 */
export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={40} className="flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="rectangular" height={48} className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};

TableSkeleton.displayName = 'TableSkeleton';

/**
 * Loading State - Component with integrated loading state
 */
export interface LoadingStateProps {
  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error?: Error | null;

  /**
   * Empty state (no data)
   */
  empty?: boolean;

  /**
   * Loading indicator component
   */
  loader?: React.ReactNode;

  /**
   * Error message component
   */
  errorComponent?: React.ReactNode;

  /**
   * Empty state component
   */
  emptyComponent?: React.ReactNode;

  /**
   * Content to show when loaded
   */
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  loading,
  error,
  empty,
  loader,
  errorComponent,
  emptyComponent,
  children,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        {loader || <LoadingSpinner size="lg" color="primary" />}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {errorComponent || (
          <>
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-gray-700 font-medium">加载失败</p>
            <p className="text-sm text-gray-500 mt-1">{error.message}</p>
          </>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        {emptyComponent || (
          <>
            <div className="text-gray-400 text-4xl mb-4">📭</div>
            <p className="text-gray-500">暂无数据</p>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

LoadingState.displayName = 'LoadingState';
