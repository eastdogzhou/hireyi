/**
 * Tooltip Component
 * 工具提示组件 - 用于显示提示信息
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils/cn';

export interface TooltipProps {
  /**
   * Tooltip content
   */
  content: React.ReactNode;

  /**
   * Children element to attach tooltip to
   */
  children: React.ReactNode;

  /**
   * Tooltip placement
   */
  placement?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Show delay (ms)
   */
  delay?: number;

  /**
   * Trigger type
   */
  trigger?: 'hover' | 'click';

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Arrow size
   */
  arrow?: boolean;
}

/**
 * Tooltip component for displaying hints
 *
 * @example
 * ```tsx
 * <Tooltip content="这是一个提示">
 *   <Button>鼠标悬停</Button>
 * </Tooltip>
 * ```
 */
export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
  delay = 200,
  trigger = 'hover',
  className,
  arrow = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (placement) {
      case 'top':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
        x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        y = triggerRect.bottom + 8;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 8;
        y = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        break;
    }

    setPosition({ x, y });
  };

  const show = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') show();
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') hide();
  };

  const handleClick = () => {
    if (trigger === 'click') {
      isVisible ? hide() : show();
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);
    }

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const arrowStyles = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'fixed z-50 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg shadow-lg animate-fade-in',
            className
          )}
          style={{ left: position.x, top: position.y }}
          role="tooltip"
        >
          {content}
          {arrow && <div className={cn('absolute w-0 h-0 border-4', arrowStyles[placement])} />}
        </div>
      )}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

/**
 * Simple Tooltip - Inline tooltip without positioning
 */
export interface SimpleTooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

export const SimpleTooltip: React.FC<SimpleTooltipProps> = ({ content, children, className }) => {
  return (
    <div className={cn('relative inline-block group', className)}>
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-4 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent" />
      </div>
    </div>
  );
};

SimpleTooltip.displayName = 'SimpleTooltip';
