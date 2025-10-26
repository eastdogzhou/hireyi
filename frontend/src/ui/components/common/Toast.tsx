/**
 * Toast Component
 * 通知提示组件 - 用于显示临时消息
 */

import React, { useEffect, useState } from 'react';
import { cn } from '../../../lib/utils/cn';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /**
   * Toast type/variant
   */
  type?: ToastType;

  /**
   * Toast title
   */
  title?: string;

  /**
   * Toast message
   */
  message: string;

  /**
   * Duration in milliseconds (0 = no auto-dismiss)
   */
  duration?: number;

  /**
   * Show close button
   */
  closable?: boolean;

  /**
   * Callback when toast is closed
   */
  onClose?: () => void;

  /**
   * Toast position
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

  /**
   * Custom icon
   */
  icon?: React.ReactNode;

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Toast notification component
 *
 * @example
 * ```tsx
 * <Toast
 *   type="success"
 *   title="成功"
 *   message="操作已成功完成"
 *   duration={3000}
 * />
 * ```
 */
export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  duration = 3000,
  closable = true,
  onClose,
  icon,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const defaultIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-md transition-all duration-300',
        typeStyles[type],
        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0 animate-fade-in-up',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className={cn('flex-shrink-0 w-5 h-5 flex items-center justify-center font-bold', iconColors[type])}>
        {icon || defaultIcons[type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{message}</div>
      </div>

      {/* Close Button */}
      {closable && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

Toast.displayName = 'Toast';

/**
 * Toast Container - Container for multiple toasts
 */
export interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  children: React.ReactNode;
  className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ position = 'top-right', children, className }) => {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={cn('fixed z-50 flex flex-col gap-3', positionStyles[position], className)} aria-live="polite">
      {children}
    </div>
  );
};

ToastContainer.displayName = 'ToastContainer';

/**
 * Toast State Management (Simple Hook)
 */
export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

let toastId = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = (toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message: string, title?: string, duration?: number) => {
    return showToast({ type: 'success', message, title, duration });
  };

  const error = (message: string, title?: string, duration?: number) => {
    return showToast({ type: 'error', message, title, duration });
  };

  const warning = (message: string, title?: string, duration?: number) => {
    return showToast({ type: 'warning', message, title, duration });
  };

  const info = (message: string, title?: string, duration?: number) => {
    return showToast({ type: 'info', message, title, duration });
  };

  return {
    toasts,
    showToast,
    hideToast,
    success,
    error,
    warning,
    info,
  };
}

/**
 * Toast Provider Component (Example usage)
 */
export const ToastProvider: React.FC<{ children: React.ReactNode; position?: ToastContainerProps['position'] }> = ({
  children,
  position = 'top-right',
}) => {
  const { toasts, hideToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer position={position}>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </>
  );
};

ToastProvider.displayName = 'ToastProvider';
