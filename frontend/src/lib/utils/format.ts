/**
 * Formatting utility functions
 * 格式化工具函数
 */

/**
 * Format file size to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';

  // Chinese phone number format: 138-1234-5678
  if (phone.length === 11 && /^1\d{10}$/.test(phone)) {
    return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  }

  return phone;
}

/**
 * Format email for display (truncate if too long)
 */
export function formatEmail(email: string | null | undefined, maxLength: number = 30): string {
  if (!email) return '-';

  if (email.length <= maxLength) return email;

  const [username, domain] = email.split('@');
  if (username.length > maxLength - domain.length - 4) {
    return `${username.slice(0, maxLength - domain.length - 4)}...@${domain}`;
  }

  return email;
}

/**
 * Format date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}个月前`;

  return `${Math.floor(diffDay / 365)}年前`;
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | Date | null | undefined, format: 'short' | 'long' | 'time' = 'short'): string {
  if (!date) return '-';

  try {
    const d = new Date(date);

    if (format === 'time') {
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    if (format === 'long') {
      return d.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
    }

    return d.toLocaleDateString('zh-CN');
  } catch {
    return String(date);
  }
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined) return '-';
  return num.toLocaleString('zh-CN');
}

/**
 * Format percentage
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 0): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Format skill tags for display
 */
export function formatSkills(skills: string[] | null | undefined, maxDisplay: number = 5): {
  displayed: string[];
  remaining: number;
} {
  if (!skills || skills.length === 0) {
    return { displayed: [], remaining: 0 };
  }

  if (skills.length <= maxDisplay) {
    return { displayed: skills, remaining: 0 };
  }

  return {
    displayed: skills.slice(0, maxDisplay),
    remaining: skills.length - maxDisplay,
  };
}

/**
 * Get initials from name (for avatars)
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';

  const chars = name.trim().split('');
  if (chars.length === 0) return '?';
  if (chars.length === 1) return chars[0].toUpperCase();

  // For Chinese names, take last 2 characters
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return chars.slice(-2).join('');
  }

  // For English names, take first letter of each word
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Format duration in milliseconds to human readable
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天`;
  if (hours > 0) return `${hours}小时`;
  if (minutes > 0) return `${minutes}分钟`;
  return `${seconds}秒`;
}

/**
 * Format score to display with stars
 */
export function formatScoreStars(score: number | null, maxScore: number = 4): string {
  if (!score) return '☆'.repeat(maxScore);
  const filled = '★'.repeat(Math.min(score, maxScore));
  const empty = '☆'.repeat(Math.max(0, maxScore - score));
  return filled + empty;
}

/**
 * Format currency (CNY)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Pluralize words (English)
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural || `${singular}s`;
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}