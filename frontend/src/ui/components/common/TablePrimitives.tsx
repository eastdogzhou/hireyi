/**
 * Table Primitive Components
 * 表格基础组件 - 提供灵活的表格子组件
 */

import React from 'react';
import { cn } from '../../../lib/utils/cn';

export interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  as?: 'th' | 'td';
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
}

/**
 * TableHead - 表格头部容器
 */
export const TableHead: React.FC<TableHeadProps> = ({ children, className }) => {
  return (
    <thead className={cn('bg-gray-50 border-b border-gray-200', className)}>
      {children}
    </thead>
  );
};

TableHead.displayName = 'TableHead';

/**
 * TableBody - 表格主体容器
 */
export const TableBody: React.FC<TableBodyProps> = ({ children, className }) => {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  );
};

TableBody.displayName = 'TableBody';

/**
 * TableRow - 表格行
 */
export const TableRow: React.FC<TableRowProps> = ({ children, className, onClick }) => {
  return (
    <tr
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

TableRow.displayName = 'TableRow';

/**
 * TableCell - 表格单元格
 */
export const TableCell: React.FC<TableCellProps> = ({
  children,
  className,
  as = 'td',
  align = 'left',
  colSpan,
  rowSpan,
}) => {
  const Component = as;

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  const baseStyles = as === 'th'
    ? 'px-4 py-3 font-medium text-gray-700'
    : 'px-4 py-3 text-gray-900';

  return (
    <Component
      className={cn(baseStyles, alignClass, className)}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </Component>
  );
};

TableCell.displayName = 'TableCell';
