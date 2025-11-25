/**
 * ErrorBoundary Component
 * 错误边界组件 - 捕获React组件错误
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { cn } from '../../../lib/utils/cn';

interface ErrorBoundaryProps {
  /**
   * Child components
   */
  children: ReactNode;

  /**
   * Custom fallback UI
   */
  fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);

  /**
   * Error callback
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /**
   * Reset error on route change
   */
  resetOnPropsChange?: boolean;

  /**
   * Additional CSS class
   */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary component for catching React errors
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state
    this.setState({
      error,
      errorInfo,
    });

    // Call error callback
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service (e.g., Sentry)
    // reportError(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset error when props change (e.g., route change)
    if (this.props.resetOnPropsChange && prevProps.children !== this.props.children) {
      this.reset();
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.state.errorInfo!);
        }
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.reset}
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  className?: string;
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, errorInfo, onReset, className }) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className={cn('flex items-center justify-center min-h-[400px] p-8', className)}>
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200 p-8">
        {/* Error icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">页面出错了</h2>
        <p className="text-gray-600 text-center mb-6">抱歉，页面遇到了一个错误。请尝试刷新页面或联系技术支持。</p>

        {/* Error message */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-mono text-red-800">{error.message}</p>
        </div>

        {/* Error details toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-orange-500 hover:text-orange-600 transition-colors mb-4"
        >
          {showDetails ? '隐藏' : '显示'}技术详情
        </button>

        {/* Error stack trace */}
        {showDetails && (
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
            <p className="text-xs font-mono whitespace-pre-wrap">{error.stack}</p>
            {errorInfo && (
              <>
                <hr className="my-3 border-gray-700" />
                <p className="text-xs font-mono whitespace-pre-wrap">{errorInfo.componentStack}</p>
              </>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReset}
            className="px-6 py-2.5 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors font-medium"
          >
            重新加载
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors font-medium"
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Simple Error Fallback - Minimal error display
 */
export const SimpleErrorFallback: React.FC<{ error: Error; onReset?: () => void }> = ({ error, onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-red-500 text-4xl mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">出错了</h3>
      <p className="text-sm text-gray-600 mb-4 text-center max-w-md">{error.message}</p>
      {onReset && (
        <button
          onClick={onReset}
          className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors text-sm"
        >
          重试
        </button>
      )}
    </div>
  );
};

SimpleErrorFallback.displayName = 'SimpleErrorFallback';

/**
 * withErrorBoundary HOC - Wrap component with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

/**
 * useErrorHandler Hook - Throw errors to nearest error boundary
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error>();

  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
