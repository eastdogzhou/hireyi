/**
 * Tabs Primitive Components
 * 标签页基础组件 - 提供灵活的标签页子组件 (类 Radix UI 风格)
 */

import React, { createContext, useContext, useState } from 'react';
import { cn } from '../../../lib/utils/cn';

// Context for Tabs state
interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs compound components must be used within Tabs');
  }
  return context;
};

// Main Tabs component
export interface TabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  children,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

Tabs.displayName = 'Tabs';

// TabsList component
export interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  );
};

TabsList.displayName = 'TabsList';

// TabsTrigger component
export interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value: triggerValue,
  children,
  className,
  disabled = false,
}) => {
  const { value, onValueChange } = useTabsContext();
  const isActive = value === triggerValue;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(triggerValue)}
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500',
        isActive
          ? 'bg-white text-orange-600 shadow-sm'
          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

TabsTrigger.displayName = 'TabsTrigger';

// TabsContent component
export interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value: contentValue,
  children,
  className,
}) => {
  const { value } = useTabsContext();

  if (value !== contentValue) {
    return null;
  }

  return (
    <div role="tabpanel" className={cn('mt-4', className)}>
      {children}
    </div>
  );
};

TabsContent.displayName = 'TabsContent';
