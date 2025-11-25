/**
 * EmptyState Component
 * 空状态组件 - 用于显示无数据状态
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';
import { Button } from './Button';

export interface EmptyStateProps {
  /**
   * Icon or illustration
   */
  icon?: React.ReactNode;

  /**
   * Title text
   */
  title?: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Action button
   */
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };

  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };

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
 * EmptyState component for displaying no data state
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="📭"
 *   title="暂无候选人"
 *   description="开始上传简历以添加候选人"
 *   action={{
 *     label: "上传简历",
 *     onClick: handleUpload
 *   }}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md',
}) => {
  const sizeConfig = {
    sm: {
      container: 'py-8',
      icon: 'text-4xl mb-3',
      title: 'text-lg',
      description: 'text-sm',
    },
    md: {
      container: 'py-12',
      icon: 'text-6xl mb-4',
      title: 'text-xl',
      description: 'text-base',
    },
    lg: {
      container: 'py-16',
      icon: 'text-8xl mb-6',
      title: 'text-2xl',
      description: 'text-lg',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', config.container, className)}>
      {/* Icon */}
      {icon && (
        <div className={cn('text-gray-400', config.icon)}>
          {typeof icon === 'string' ? <span>{icon}</span> : icon}
        </div>
      )}

      {/* Title */}
      {title && <h3 className={cn('font-semibold text-gray-900 mb-2', config.title)}>{title}</h3>}

      {/* Description */}
      {description && <p className={cn('text-gray-500 max-w-md', config.description)}>{description}</p>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex gap-3 mt-6">
          {action && (
            <Button variant="primary" size="md" icon={action.icon} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="secondary" size="md" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';

/**
 * No Results - Specialized empty state for search results
 */
export interface NoResultsProps {
  searchTerm?: string;
  onClear?: () => void;
  className?: string;
}

export const NoResults: React.FC<NoResultsProps> = ({ searchTerm, onClear, className }) => {
  return (
    <EmptyState
      icon="🔍"
      title="未找到结果"
      description={searchTerm ? `没有找到与 "${searchTerm}" 相关的结果` : '没有找到匹配的结果'}
      action={
        onClear
          ? {
              label: '清除筛选',
              onClick: onClear,
            }
          : undefined
      }
      size="md"
      className={className}
    />
  );
};

NoResults.displayName = 'NoResults';

/**
 * Error State - Specialized empty state for errors
 */
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = '加载失败',
  message = '无法加载数据，请稍后重试',
  onRetry,
  className,
}) => {
  return (
    <EmptyState
      icon="⚠️"
      title={title}
      description={message}
      action={
        onRetry
          ? {
              label: '重试',
              onClick: onRetry,
            }
          : undefined
      }
      size="md"
      className={className}
    />
  );
};

ErrorState.displayName = 'ErrorState';

/**
 * Coming Soon - Specialized empty state for features in development
 */
export interface ComingSoonProps {
  featureName?: string;
  className?: string;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ featureName = '该功能', className }) => {
  return (
    <EmptyState
      icon="🚧"
      title="即将推出"
      description={`${featureName}正在开发中，敬请期待`}
      size="md"
      className={className}
    />
  );
};

ComingSoon.displayName = 'ComingSoon';

/**
 * No Data - Simple no data state
 */
export interface NoDataProps {
  entity?: string;
  onAdd?: () => void;
  className?: string;
}

export const NoData: React.FC<NoDataProps> = ({ entity = '数据', onAdd, className }) => {
  return (
    <EmptyState
      icon="📭"
      title={`暂无${entity}`}
      description={`还没有任何${entity}，开始添加吧`}
      action={
        onAdd
          ? {
              label: `添加${entity}`,
              onClick: onAdd,
            }
          : undefined
      }
      size="md"
      className={className}
    />
  );
};

NoData.displayName = 'NoData';
