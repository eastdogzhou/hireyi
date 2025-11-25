/**
 * Badge Component
 * 徽章/标签组件 - 用于显示状态、标签等
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant/color
   */
  variant?:
    | 'default'
    | 'primary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'gray';

  /**
   * Badge size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Icon element
   */
  icon?: React.ReactNode;

  /**
   * Show dot indicator
   */
  dot?: boolean;

  /**
   * Badge shape
   */
  shape?: 'rounded' | 'square';
}

/**
 * Badge component for status indicators and tags
 *
 * @example
 * ```tsx
 * <Badge variant="success">已入职</Badge>
 * <Badge variant="primary" icon={<UserIcon />}>候选人</Badge>
 * ```
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  shape = 'rounded',
  className,
  children,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center font-medium whitespace-nowrap transition-colors';

  const variantStyles = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-orange-100 text-orange-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    gray: 'bg-gray-100 text-gray-600',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const shapeStyles = {
    rounded: 'rounded-full',
    square: 'rounded',
  };

  const dotColor = {
    default: 'bg-gray-400',
    primary: 'bg-orange-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    info: 'bg-blue-500',
    gray: 'bg-gray-400',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        shapeStyles[shape],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full mr-1.5',
            dotColor[variant]
          )}
          aria-hidden="true"
        />
      )}

      {icon && <span className="mr-1">{icon}</span>}

      {children}
    </span>
  );
};

Badge.displayName = 'Badge';

/**
 * Score Badge - Specialized badge for displaying scores (1-4)
 */
export interface ScoreBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  score: 1 | 2 | 3 | 4 | null;
  showStars?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  showStars = false,
  ...props
}) => {
  if (!score) {
    return (
      <Badge variant="gray" {...props}>
        未评分
      </Badge>
    );
  }

  const scoreConfig = {
    4: { variant: 'success' as const, label: '优秀', stars: '★★★★' },
    3: { variant: 'info' as const, label: '良好', stars: '★★★' },
    2: { variant: 'warning' as const, label: '合格', stars: '★★' },
    1: { variant: 'danger' as const, label: '待提升', stars: '★' },
  };

  const config = scoreConfig[score];

  return (
    <Badge variant={config.variant} {...props}>
      {showStars ? config.stars : config.label}
    </Badge>
  );
};

ScoreBadge.displayName = 'ScoreBadge';

/**
 * Status Badge - Specialized badge for candidate status
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status:
    | 'screening'
    | 'interview'
    | 'offer'
    | 'hired'
    | 'rejected'
    | 'withdrawn'
    | 'open'
    | 'closed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const statusConfig = {
    screening: { variant: 'info' as const, label: '筛选中', icon: '🔍' },
    interview: { variant: 'primary' as const, label: '面试中', icon: '💬' },
    offer: { variant: 'warning' as const, label: '已发Offer', icon: '📨' },
    hired: { variant: 'success' as const, label: '已入职', icon: '✅' },
    rejected: { variant: 'danger' as const, label: '已拒绝', icon: '❌' },
    withdrawn: { variant: 'gray' as const, label: '已放弃', icon: '🚪' },
    open: { variant: 'success' as const, label: '招聘中', icon: '🟢' },
    closed: { variant: 'gray' as const, label: '已关闭', icon: '⚫' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot {...props}>
      {config.icon} {config.label}
    </Badge>
  );
};

StatusBadge.displayName = 'StatusBadge';

/**
 * Badge Group - Group of badges with consistent spacing
 */
export interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  maxDisplay?: number;
}

export const BadgeGroup: React.FC<BadgeGroupProps> = ({
  children,
  className,
  maxDisplay,
}) => {
  const badges = React.Children.toArray(children);
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  return (
    <div className={cn('inline-flex flex-wrap gap-1.5', className)}>
      {displayBadges}
      {remaining > 0 && (
        <Badge variant="gray" size="sm">
          +{remaining}
        </Badge>
      )}
    </div>
  );
};

BadgeGroup.displayName = 'BadgeGroup';