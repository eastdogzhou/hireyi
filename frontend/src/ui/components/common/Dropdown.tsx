/**
 * Dropdown Component
 * 下拉菜单组件 - 用于显示操作菜单
 */

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../../lib/utils/cn';

export interface DropdownMenuItem {
  /**
   * Menu item key
   */
  key: string;

  /**
   * Menu item label
   */
  label: string;

  /**
   * Menu item icon
   */
  icon?: React.ReactNode;

  /**
   * Click callback
   */
  onClick?: () => void;

  /**
   * Disabled state
   */
  disabled?: boolean;

  /**
   * Danger style (red text)
   */
  danger?: boolean;

  /**
   * Divider before this item
   */
  divider?: boolean;
}

export interface DropdownProps {
  /**
   * Dropdown trigger element
   */
  trigger: React.ReactNode;

  /**
   * Menu items
   */
  items: DropdownMenuItem[];

  /**
   * Dropdown placement
   */
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';

  /**
   * Menu item click callback
   */
  onItemClick?: (key: string) => void;

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Menu width
   */
  menuWidth?: string | number;

  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * Dropdown component for action menus
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button>操作</Button>}
 *   items={[
 *     { key: 'edit', label: '编辑', icon: <EditIcon /> },
 *     { key: 'delete', label: '删除', danger: true },
 *   ]}
 *   onItemClick={handleAction}
 * />
 * ```
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  placement = 'bottom-start',
  onItemClick,
  className,
  menuWidth = 200,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return;

    item.onClick?.();
    onItemClick?.(item.key);
    setIsOpen(false);
  };

  const placementStyles = {
    'bottom-start': 'top-full left-0 mt-2',
    'bottom-end': 'top-full right-0 mt-2',
    'top-start': 'bottom-full left-0 mb-2',
    'top-end': 'bottom-full right-0 mb-2',
  };

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(disabled && 'opacity-50 cursor-not-allowed')}
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 animate-fade-in-up',
            placementStyles[placement]
          )}
          style={{ width: typeof menuWidth === 'number' ? `${menuWidth}px` : menuWidth }}
          role="menu"
        >
          {items.map((item, index) => (
            <React.Fragment key={item.key}>
              {item.divider && index > 0 && <div className="my-1 border-t border-gray-200" />}

              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                )}
                role="menuitem"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = 'Dropdown';

/**
 * Dropdown Button - Button with dropdown icon
 */
export interface DropdownButtonProps extends Omit<DropdownProps, 'trigger'> {
  /**
   * Button label
   */
  label: string;

  /**
   * Button variant
   */
  variant?: 'primary' | 'secondary' | 'ghost';

  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg';
}

export const DropdownButton: React.FC<DropdownButtonProps> = ({
  label,
  variant = 'secondary',
  size = 'md',
  ...dropdownProps
}) => {
  const variantStyles = {
    primary: 'bg-orange-500 text-white hover:bg-orange-600',
    secondary: 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
  };

  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-5 py-2.5',
  };

  const trigger = (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-full transition-colors font-medium',
        variantStyles[variant],
        sizeStyles[size]
      )}
    >
      <span>{label}</span>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return <Dropdown trigger={trigger} {...dropdownProps} />;
};

DropdownButton.displayName = 'DropdownButton';

/**
 * Action Dropdown - Three dots menu
 */
export interface ActionDropdownProps extends Omit<DropdownProps, 'trigger'> {
  /**
   * Icon size
   */
  size?: 'sm' | 'md' | 'lg';
}

export const ActionDropdown: React.FC<ActionDropdownProps> = ({ size = 'md', ...dropdownProps }) => {
  const sizeConfig = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const trigger = (
    <button
      className={cn(
        'flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors',
        sizeConfig[size]
      )}
      aria-label="More actions"
    >
      <div className="flex flex-col gap-0.5">
        <div className={cn('bg-gray-600 rounded-full', dotSize[size])} />
        <div className={cn('bg-gray-600 rounded-full', dotSize[size])} />
        <div className={cn('bg-gray-600 rounded-full', dotSize[size])} />
      </div>
    </button>
  );

  return <Dropdown trigger={trigger} placement="bottom-end" {...dropdownProps} />;
};

ActionDropdown.displayName = 'ActionDropdown';

/**
 * Context Menu - Right-click menu
 */
export interface ContextMenuProps {
  /**
   * Menu items
   */
  items: DropdownMenuItem[];

  /**
   * Children to attach context menu to
   */
  children: React.ReactNode;

  /**
   * Menu item click callback
   */
  onItemClick?: (key: string) => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ items, children, onItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    item.onClick?.();
    onItemClick?.(item.key);
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>{children}</div>

      {isOpen && (
        <div
          ref={menuRef}
          className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] animate-fade-in"
          style={{ left: position.x, top: position.y }}
          role="menu"
        >
          {items.map((item, index) => (
            <React.Fragment key={item.key}>
              {item.divider && index > 0 && <div className="my-1 border-t border-gray-200" />}

              <button
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-left text-sm transition-colors',
                  item.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                )}
                role="menuitem"
              >
                {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </>
  );
};

ContextMenu.displayName = 'ContextMenu';
