/**
 * Modal Component
 * 模态框组件 - 用于显示对话框和弹窗
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '../../../lib/utils/cn';

export interface ModalProps {
  /**
   * Show/hide modal
   */
  open: boolean;

  /**
   * Callback when modal should close
   */
  onClose: () => void;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal size
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

  /**
   * Show close button
   */
  showCloseButton?: boolean;

  /**
   * Close on overlay click
   */
  closeOnOverlayClick?: boolean;

  /**
   * Close on escape key
   */
  closeOnEscape?: boolean;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Additional CSS class for modal content
   */
  className?: string;

  /**
   * Additional CSS class for overlay
   */
  overlayClassName?: string;
}

/**
 * Modal component for dialogs and popups
 *
 * @example
 * ```tsx
 * <Modal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="编辑候选人"
 *   size="md"
 * >
 *   <p>Modal content here</p>
 * </Modal>
 * ```
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  children,
  className,
  overlayClassName,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, closeOnEscape, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (!open) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTab as any);
    firstElement?.focus();

    return () => {
      modal.removeEventListener('keydown', handleTab as any);
    };
  }, [open]);

  if (!open) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white rounded-xl shadow-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up',
          sizeStyles[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

Modal.displayName = 'Modal';

/**
 * Modal Header - For custom modal headers
 */
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ children, className }) => {
  return <div className={cn('px-6 py-4 border-b border-gray-200', className)}>{children}</div>;
};

ModalHeader.displayName = 'ModalHeader';

/**
 * Modal Body - For modal content
 */
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const ModalBody: React.FC<ModalBodyProps> = ({ children, className }) => {
  return <div className={cn('flex-1 overflow-y-auto px-6 py-4', className)}>{children}</div>;
};

ModalBody.displayName = 'ModalBody';

/**
 * Modal Footer - For modal actions
 */
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const ModalFooter: React.FC<ModalFooterProps> = ({ children, className, align = 'right' }) => {
  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={cn('px-6 py-4 border-t border-gray-200 flex gap-3', alignStyles[align], className)}>
      {children}
    </div>
  );
};

ModalFooter.displayName = 'ModalFooter';

/**
 * Confirm Dialog - Specialized modal for confirmations
 */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = '确认操作',
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'info',
  loading = false,
}) => {
  const typeConfig = {
    info: {
      icon: 'ℹ',
      iconColor: 'text-blue-500',
      confirmVariant: 'primary' as const,
    },
    warning: {
      icon: '⚠',
      iconColor: 'text-yellow-500',
      confirmVariant: 'primary' as const,
    },
    danger: {
      icon: '⚠',
      iconColor: 'text-red-500',
      confirmVariant: 'danger' as const,
    },
  };

  const config = typeConfig[type];

  return (
    <Modal open={open} onClose={onClose} size="sm" title={title}>
      <div className="flex items-start gap-4">
        <div className={cn('flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl', config.iconColor)}>
          {config.icon}
        </div>
        <div className="flex-1 pt-1">
          <p className="text-gray-700">{message}</p>
        </div>
      </div>

      <ModalFooter className="mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'px-4 py-2 rounded-full text-white transition-all disabled:opacity-50',
            config.confirmVariant === 'danger'
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-orange-500 hover:bg-orange-600'
          )}
        >
          {loading ? '处理中...' : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';

/**
 * Alert Dialog - Simple alert modal
 */
export interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
}

export const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onClose,
  title,
  message,
  type = 'info',
  confirmText = '确定',
}) => {
  const typeConfig = {
    success: { icon: '✓', iconColor: 'text-green-500', defaultTitle: '成功' },
    error: { icon: '✕', iconColor: 'text-red-500', defaultTitle: '错误' },
    warning: { icon: '⚠', iconColor: 'text-yellow-500', defaultTitle: '警告' },
    info: { icon: 'ℹ', iconColor: 'text-blue-500', defaultTitle: '提示' },
  };

  const config = typeConfig[type];

  return (
    <Modal open={open} onClose={onClose} size="sm" title={title || config.defaultTitle}>
      <div className="flex items-start gap-4">
        <div className={cn('flex-shrink-0 w-10 h-10 flex items-center justify-center text-2xl', config.iconColor)}>
          {config.icon}
        </div>
        <div className="flex-1 pt-1">
          <p className="text-gray-700">{message}</p>
        </div>
      </div>

      <ModalFooter className="mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors"
        >
          {confirmText}
        </button>
      </ModalFooter>
    </Modal>
  );
};

AlertDialog.displayName = 'AlertDialog';
