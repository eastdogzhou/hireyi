/**
 * Tabs Component
 * 标签页组件 - 用于内容切换
 */

import React, { useState } from 'react';
import { cn } from '../../../lib/utils/cn';

export interface TabItem {
  /**
   * Tab key
   */
  key: string;

  /**
   * Tab label
   */
  label: string;

  /**
   * Tab icon
   */
  icon?: React.ReactNode;

  /**
   * Tab content
   */
  content?: React.ReactNode;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Badge count
   */
  badge?: number | string;
}

export interface TabsProps {
  /**
   * Tab items
   */
  items: TabItem[];

  /**
   * Active tab key
   */
  activeKey?: string;

  /**
   * Default active key
   */
  defaultActiveKey?: string;

  /**
   * Tab change callback
   */
  onChange?: (key: string) => void;

  /**
   * Tab variant
   */
  variant?: 'line' | 'card' | 'pill';

  /**
   * Tab size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Tab alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Show content
   */
  showContent?: boolean;

  /**
   * Additional CSS class
   */
  className?: string;
}

/**
 * Tabs component for content switching
 *
 * @example
 * ```tsx
 * <Tabs
 *   items={[
 *     { key: 'info', label: '基本信息', content: <Info /> },
 *     { key: 'skills', label: '技能', content: <Skills /> },
 *   ]}
 *   defaultActiveKey="info"
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  variant = 'line',
  size = 'md',
  align = 'left',
  showContent = true,
  className,
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;
  const activeItem = items.find((item) => item.key === activeKey);

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;

    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }

    onChange?.(key);
  };

  const sizeConfig = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };

  const alignStyles = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  // Line variant (underline)
  if (variant === 'line') {
    return (
      <div className={className}>
        <div className={cn('flex border-b border-gray-200', alignStyles[align])}>
          {items.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key, item.disabled)}
                disabled={item.disabled}
                className={cn(
                  'relative flex items-center gap-2 border-b-2 transition-all font-medium',
                  sizeConfig[size],
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full min-w-[20px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showContent && activeItem?.content && <div className="mt-4">{activeItem.content}</div>}
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <div className={className}>
        <div className={cn('flex gap-1 p-1 bg-gray-100 rounded-lg', alignStyles[align])}>
          {items.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key, item.disabled)}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-lg transition-all font-medium',
                  sizeConfig[size],
                  isActive ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center',
                      isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showContent && activeItem?.content && <div className="mt-4">{activeItem.content}</div>}
      </div>
    );
  }

  // Pill variant
  if (variant === 'pill') {
    return (
      <div className={className}>
        <div className={cn('flex gap-2', alignStyles[align])}>
          {items.map((item) => {
            const isActive = item.key === activeKey;

            return (
              <button
                key={item.key}
                onClick={() => handleTabClick(item.key, item.disabled)}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-full transition-all font-medium',
                  sizeConfig[size],
                  isActive
                    ? 'bg-orange-500 text-white shadow-orange'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                  item.disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {item.icon && <span>{item.icon}</span>}
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={cn(
                      'ml-1 px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center',
                      isActive ? 'bg-white text-orange-600' : 'bg-gray-200 text-gray-700'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {showContent && activeItem?.content && <div className="mt-4">{activeItem.content}</div>}
      </div>
    );
  }

  return null;
};

Tabs.displayName = 'Tabs';

/**
 * Vertical Tabs - Tabs with vertical layout
 */
export interface VerticalTabsProps extends Omit<TabsProps, 'align'> {
  /**
   * Tab width
   */
  tabWidth?: string | number;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  items,
  activeKey: controlledActiveKey,
  defaultActiveKey,
  onChange,
  size = 'md',
  showContent = true,
  tabWidth = 200,
  className,
}) => {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || items[0]?.key);

  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey;
  const activeItem = items.find((item) => item.key === activeKey);

  const handleTabClick = (key: string, disabled?: boolean) => {
    if (disabled) return;

    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }

    onChange?.(key);
  };

  const sizeConfig = {
    sm: 'text-sm px-3 py-2',
    md: 'text-base px-4 py-2.5',
    lg: 'text-lg px-5 py-3',
  };

  return (
    <div className={cn('flex gap-4', className)}>
      {/* Tab list */}
      <div className="flex flex-col gap-1" style={{ width: typeof tabWidth === 'number' ? `${tabWidth}px` : tabWidth }}>
        {items.map((item) => {
          const isActive = item.key === activeKey;

          return (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key, item.disabled)}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-3 rounded-lg transition-all font-medium text-left',
                sizeConfig[size],
                isActive
                  ? 'bg-orange-50 text-orange-600 border-l-4 border-orange-500'
                  : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.icon && <span>{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center',
                    isActive ? 'bg-orange-100 text-orange-700' : 'bg-gray-200 text-gray-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {showContent && activeItem?.content && <div className="flex-1">{activeItem.content}</div>}
    </div>
  );
};

VerticalTabs.displayName = 'VerticalTabs';
