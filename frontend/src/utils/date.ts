/**
 * Date Utility Functions
 * 日期格式化工具函数
 */

/**
 * Format date string to Chinese locale
 * 格式化日期为中文显示格式
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (YYYY-MM-DD HH:mm)
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format date string to date only (no time)
 * 格式化日期为仅日期（无时间）
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateOnly(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
