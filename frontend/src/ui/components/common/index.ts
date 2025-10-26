/**
 * Common UI Components
 * Export all common components from a single entry point
 */

// Button Components
export { Button, IconButton, ButtonGroup } from './Button';
export type { ButtonProps, IconButtonProps, ButtonGroupProps } from './Button';

// Card Components
export { Card, CardHeader, CardContent, CardFooter, CardGrid } from './Card';
export type { CardProps, CardHeaderProps, CardContentProps, CardFooterProps, CardGridProps } from './Card';

// Badge Components
export { Badge, ScoreBadge, StatusBadge, BadgeGroup } from './Badge';
export type { BadgeProps, ScoreBadgeProps, StatusBadgeProps, BadgeGroupProps } from './Badge';

// Input Components
export { Input, TextArea, Select, FormField, InputGroup } from './Input';
export type { InputProps, TextAreaProps, SelectProps, FormFieldProps, InputGroupProps } from './Input';

// SelectDropdown Component (Advanced Select with search, multi-select, etc.)
export { SelectDropdown } from './SelectDropdown';
export type { SelectDropdownProps, SelectOption } from './SelectDropdown';

// Loading Components
export {
  LoadingSpinner,
  LoadingDots,
  LoadingOverlay,
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  LoadingState,
} from './Loading';
export type {
  LoadingSpinnerProps,
  LoadingDotsProps,
  LoadingOverlayProps,
  SkeletonProps,
  TableSkeletonProps,
  LoadingStateProps,
} from './Loading';

// Toast Components
export { Toast, ToastContainer, ToastProvider, useToast } from './Toast';
export type { ToastProps, ToastContainerProps, ToastType, ToastItem } from './Toast';

// Modal Components
export { Modal, ModalHeader, ModalBody, ModalFooter, ConfirmDialog, AlertDialog } from './Modal';
export type {
  ModalProps,
  ModalHeaderProps,
  ModalBodyProps,
  ModalFooterProps,
  ConfirmDialogProps,
  AlertDialogProps,
} from './Modal';

// EmptyState Components
export { EmptyState, NoResults, ErrorState, ComingSoon, NoData } from './EmptyState';
export type { EmptyStateProps, NoResultsProps, ErrorStateProps, ComingSoonProps, NoDataProps } from './EmptyState';

// Pagination Components
export { Pagination, SimplePagination, LoadMore } from './Pagination';
export type { PaginationProps, SimplePaginationProps, LoadMoreProps } from './Pagination';

// Table Components
export { Table, SimpleTable } from './Table';
export type { TableProps, TableColumn, SortDirection, SimpleTableProps } from './Table';

// Table Primitive Components
export { TableHead, TableBody, TableRow, TableCell } from './TablePrimitives';
export type { TableHeadProps, TableBodyProps, TableRowProps, TableCellProps } from './TablePrimitives';

// SearchBar Components
export { SearchBar, AdvancedSearchBar, SearchWithTags } from './SearchBar';
export type { SearchBarProps, AdvancedSearchBarProps, SearchWithTagsProps, SearchTag } from './SearchBar';

// ErrorBoundary Components
export { ErrorBoundary, SimpleErrorFallback, withErrorBoundary, useErrorHandler } from './ErrorBoundary';

// Dropdown Components
export { Dropdown, DropdownButton, ActionDropdown, ContextMenu } from './Dropdown';
export type { DropdownProps, DropdownMenuItem, DropdownButtonProps, ActionDropdownProps, ContextMenuProps } from './Dropdown';

// Tooltip Components
export { Tooltip, SimpleTooltip } from './Tooltip';
export type { TooltipProps, SimpleTooltipProps } from './Tooltip';

// Tabs Components (Full)
export { Tabs as TabsOld, VerticalTabs } from './Tabs';
export type { TabsProps as TabsOldProps, TabItem, VerticalTabsProps } from './Tabs';

// Tabs Primitive Components (Radix-style)
export { Tabs, TabsList, TabsTrigger, TabsContent } from './TabsPrimitives';
export type { TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps } from './TabsPrimitives';

// Alert Components
export { Alert, ErrorAlert, SuccessAlert, WarningAlert, InfoAlert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';
