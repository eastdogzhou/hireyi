/**
 * Utility function to merge class names
 * TailwindCSS class name merger with clsx and tailwind-merge
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge multiple class names and resolve Tailwind conflicts
 * @param inputs - Class names to merge
 * @returns Merged class string
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') // conditional classes
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Conditional class names helper
 * @example
 * ```tsx
 * <div className={cx({
 *   'bg-red-500': isError,
 *   'bg-green-500': isSuccess,
 *   'bg-gray-500': !isError && !isSuccess
 * })} />
 * ```
 */
export function cx(classes: Record<string, boolean>): string {
  return Object.entries(classes)
    .filter(([, condition]) => condition)
    .map(([className]) => className)
    .join(' ');
}