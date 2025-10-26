/**
 * Alert Component
 * 警告/提示框组件 - 用于显示持久的消息反馈
 */

import React from 'react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  error: 'bg-red-50 border-red-200 text-red-900',
};

const variantIcons: Record<AlertVariant, string> = {
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

/**
 * Alert - 内联警告/提示框组件
 *
 * @example
 * ```tsx
 * <Alert variant="error">
 *   操作失败，请重试
 * </Alert>
 *
 * <Alert variant="success" title="成功">
 *   数据已保存
 * </Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  icon,
  onClose,
}) => {
  const baseStyles = 'border rounded-lg p-4 flex items-start gap-3';
  const styles = `${baseStyles} ${variantStyles[variant]} ${className}`;
  const defaultIcon = variantIcons[variant];

  return (
    <div className={styles} role="alert">
      {/* Icon */}
      <div className="flex-shrink-0 text-lg">
        {icon || defaultIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">
            {title}
          </h4>
        )}
        <div className="text-sm">
          {children}
        </div>
      </div>

      {/* Close button */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="关闭"
        >
          ✕
        </button>
      )}
    </div>
  );
};

Alert.displayName = 'Alert';

/**
 * Alert variants for quick access
 */
export const ErrorAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="error" {...props} />
);

export const SuccessAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="success" {...props} />
);

export const WarningAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="warning" {...props} />
);

export const InfoAlert: React.FC<Omit<AlertProps, 'variant'>> = (props) => (
  <Alert variant="info" {...props} />
);
