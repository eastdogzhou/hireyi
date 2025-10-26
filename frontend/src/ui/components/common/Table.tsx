/**
 * Table Component
 * 表格组件 - 用于显示数据列表
 */

import React, { useState } from 'react';
import { cn } from '../../../lib/utils/cn';
import { LoadingSpinner } from './Loading';
import { EmptyState } from './EmptyState';

export type SortDirection = 'asc' | 'desc' | null;

export interface TableColumn<T = any> {
  /**
   * Column key (must match data key)
   */
  key: string;

  /**
   * Column header title
   */
  title: string;

  /**
   * Custom render function
   */
  render?: (value: any, record: T, index: number) => React.ReactNode;

  /**
   * Column width (CSS value)
   */
  width?: string | number;

  /**
   * Enable sorting
   */
  sortable?: boolean;

  /**
   * Column alignment
   */
  align?: 'left' | 'center' | 'right';

  /**
   * Fixed column (sticky)
   */
  fixed?: 'left' | 'right';

  /**
   * Custom class name
   */
  className?: string;
}

export interface TableProps<T = any> {
  /**
   * Table columns configuration
   */
  columns: TableColumn<T>[];

  /**
   * Table data source
   */
  data: T[];

  /**
   * Row key field name
   */
  rowKey?: string | ((record: T) => string | number);

  /**
   * Loading state
   */
  loading?: boolean;

  /**
   * Empty state message
   */
  emptyText?: string;

  /**
   * Enable row selection
   */
  selectable?: boolean;

  /**
   * Selected row keys
   */
  selectedKeys?: (string | number)[];

  /**
   * Selection change callback
   */
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;

  /**
   * Row click callback
   */
  onRowClick?: (record: T, index: number) => void;

  /**
   * Sort change callback
   */
  onSortChange?: (key: string, direction: SortDirection) => void;

  /**
   * Enable hover effect
   */
  hoverable?: boolean;

  /**
   * Enable striped rows
   */
  striped?: boolean;

  /**
   * Table size
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Additional CSS class
   */
  className?: string;

  /**
   * Custom empty state component
   */
  emptyComponent?: React.ReactNode;
}

/**
 * Table component for displaying data lists
 *
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'name', title: '姓名', sortable: true },
 *     { key: 'email', title: '邮箱' },
 *     { key: 'score', title: '评分', render: (v) => <Badge>{v}</Badge> },
 *   ]}
 *   data={candidates}
 *   rowKey="id"
 * />
 * ```
 */
export function Table<T = any>({
  columns,
  data,
  rowKey = 'id',
  loading = false,
  emptyText = '暂无数据',
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  onRowClick,
  onSortChange,
  hoverable = true,
  striped = false,
  size = 'md',
  className,
  emptyComponent,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] ?? index;
  };

  const handleSort = (key: string) => {
    let newDirection: SortDirection = 'asc';

    if (sortKey === key) {
      if (sortDirection === 'asc') {
        newDirection = 'desc';
      } else if (sortDirection === 'desc') {
        newDirection = null;
      }
    }

    setSortKey(newDirection ? key : null);
    setSortDirection(newDirection);
    onSortChange?.(key, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allKeys = data.map((record, index) => getRowKey(record, index));
      onSelectionChange?.(allKeys);
    } else {
      onSelectionChange?.([]);
    }
  };

  const handleSelectRow = (key: string | number, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedKeys, key]);
    } else {
      onSelectionChange?.(selectedKeys.filter((k) => k !== key));
    }
  };

  const isAllSelected = data.length > 0 && selectedKeys.length === data.length;
  const isIndeterminate = selectedKeys.length > 0 && selectedKeys.length < data.length;

  const sizeConfig = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const paddingConfig = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (data.length === 0) {
    return emptyComponent || <EmptyState icon="📭" title={emptyText} size="md" />;
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className={cn('w-full border-collapse', sizeConfig[size])}>
        {/* Header */}
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {/* Selection column */}
            {selectable && (
              <th className={cn('text-left font-medium text-gray-700', paddingConfig[size])}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  aria-label="Select all"
                />
              </th>
            )}

            {/* Column headers */}
            {columns.map((column) => {
              const isSorted = sortKey === column.key;
              const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';

              return (
                <th
                  key={column.key}
                  className={cn(
                    'font-medium text-gray-700',
                    paddingConfig[size],
                    alignClass,
                    column.sortable && 'cursor-pointer select-none hover:bg-gray-100 transition-colors',
                    column.className
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <svg
                          className={cn('w-3 h-3', isSorted && sortDirection === 'asc' ? 'text-orange-500' : 'text-gray-400')}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                        <svg
                          className={cn(
                            'w-3 h-3 -mt-1',
                            isSorted && sortDirection === 'desc' ? 'text-orange-500' : 'text-gray-400'
                          )}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record, index) => {
            const key = getRowKey(record, index);
            const isSelected = selectedKeys.includes(key);

            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(record, index)}
                className={cn(
                  'transition-colors',
                  hoverable && 'hover:bg-gray-50 cursor-pointer',
                  striped && index % 2 === 1 && 'bg-gray-25',
                  isSelected && 'bg-orange-50'
                )}
              >
                {/* Selection cell */}
                {selectable && (
                  <td className={paddingConfig[size]}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleSelectRow(key, e.target.checked);
                      }}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                      aria-label={`Select row ${index + 1}`}
                    />
                  </td>
                )}

                {/* Data cells */}
                {columns.map((column) => {
                  const value = (record as any)[column.key];
                  const alignClass = column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left';

                  return (
                    <td key={column.key} className={cn('text-gray-900', paddingConfig[size], alignClass, column.className)}>
                      {column.render ? column.render(value, record, index) : value ?? '-'}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';

/**
 * Simple Table - Minimal table without features
 */
export interface SimpleTableProps {
  headers: string[];
  rows: (React.ReactNode | string)[][];
  className?: string;
}

export const SimpleTable: React.FC<SimpleTableProps> = ({ headers, rows, className }) => {
  return (
    <div className={cn('w-full overflow-x-auto rounded-lg border border-gray-200', className)}>
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-4 py-3 text-left font-medium text-gray-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-gray-900">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

SimpleTable.displayName = 'SimpleTable';
