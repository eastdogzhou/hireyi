/**
 * Card Component
 * 卡片组件 - 用于显示内容块
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   */
  variant?: 'default' | 'bordered' | 'elevated' | 'flat';

  /**
   * Add hover effect
   */
  hoverable?: boolean;

  /**
   * Add orange border on hover
   */
  orangeBorder?: boolean;

  /**
   * Padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Card container component
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hoverable = false,
      orangeBorder = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'bg-white rounded-xl overflow-hidden transition-all duration-200';

    const variantStyles = {
      default: 'shadow-sm border border-gray-200',
      bordered: 'border-2 border-gray-200',
      elevated: 'shadow-orange',
      flat: 'shadow-none border-none',
    };

    const hoverStyles = hoverable
      ? 'hover:shadow-orange hover:-translate-y-1 cursor-pointer'
      : '';

    const orangeBorderStyles = orangeBorder
      ? 'relative before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-gradient-to-r before:from-orange-500 before:to-orange-600 before:scale-x-0 hover:before:scale-x-100 before:transition-transform before:duration-300'
      : '';

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          hoverStyles,
          orangeBorderStyles,
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * Card Header
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Title text
   */
  title?: string;

  /**
   * Subtitle text
   */
  subtitle?: string;

  /**
   * Action element (e.g., button)
   */
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn('flex items-start justify-between mb-4', className)}
      {...props}
    >
      <div className="flex-1">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        )}
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        {children}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * Card Content
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent: React.FC<CardContentProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('text-gray-700', className)} {...props}>
      {children}
    </div>
  );
};

CardContent.displayName = 'CardContent';

/**
 * Card Footer
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Add border separator
   */
  bordered?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  bordered = false,
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'mt-4',
        bordered && 'pt-4 border-t border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

/**
 * Card Grid - Grid layout for cards
 */
export interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Number of columns
   */
  cols?: 1 | 2 | 3 | 4;

  /**
   * Gap size
   */
  gap?: 'sm' | 'md' | 'lg';
}

export const CardGrid: React.FC<CardGridProps> = ({
  cols = 3,
  gap = 'md',
  className,
  children,
  ...props
}) => {
  const colsStyles = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  const gapStyles = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div
      className={cn('grid', colsStyles[cols], gapStyles[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
};

CardGrid.displayName = 'CardGrid';