import { Genre } from '../types';

// Format date utilities
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateString);
  }
};

// Number formatting utilities
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Text utilities
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength - 3) + '...';
};

export const extractTextContent = (htmlString: string): string => {
  const div = document.createElement('div');
  div.innerHTML = htmlString;
  return div.textContent || div.innerText || '';
};

// Genre utilities
export const getGenreColor = (genre: Genre): string => {
  const genreColors: Record<Genre, string> = {
    fiction: 'bg-blue-100 text-blue-800',
    romance: 'bg-pink-100 text-pink-800',
    thriller: 'bg-red-100 text-red-800',
    mystery: 'bg-purple-100 text-purple-800',
    horror: 'bg-gray-100 text-gray-800',
    fantasy: 'bg-green-100 text-green-800',
    'sci-fi': 'bg-cyan-100 text-cyan-800',
    drama: 'bg-yellow-100 text-yellow-800',
    comedy: 'bg-orange-100 text-orange-800',
    biography: 'bg-indigo-100 text-indigo-800',
    memoir: 'bg-teal-100 text-teal-800',
    poetry: 'bg-rose-100 text-rose-800',
    'self-help': 'bg-emerald-100 text-emerald-800',
    educational: 'bg-violet-100 text-violet-800',
    other: 'bg-slate-100 text-slate-800',
    news: 'bg-blue-100 text-blue-800',
    interview: 'bg-purple-100 text-purple-800',
    'how-to': 'bg-green-100 text-green-800',
    'link-roundup': 'bg-yellow-100 text-yellow-800',
    discussion: 'bg-indigo-100 text-indigo-800',
    audio: 'bg-pink-100 text-pink-800',
    video: 'bg-red-100 text-red-800',
    note: 'bg-cyan-100 text-cyan-800',
  };
  return genreColors[genre] || genreColors.other;
};

export const getGenreIcon = (genre: Genre): string => {
  const genreIcons: Record<Genre, string> = {
    fiction: '📚',
    romance: '💖',
    thriller: '⚡',
    mystery: '🔍',
    horror: '👻',
    fantasy: '🧙',
    'sci-fi': '🚀',
    drama: '🎭',
    comedy: '😂',
    biography: '📖',
    memoir: '✍️',
    poetry: '🎨',
    'self-help': '💪',
    educational: '🎓',
    other: '📄',
    news: '📰',
    interview: '🎤',
    'how-to': '🔧',
    'link-roundup': '🔗',
    discussion: '💬',
    audio: '🎵',
    video: '🎥',
    note: '📝',
  };
  return genreIcons[genre] || genreIcons.other;
};

// URL utilities
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

// File utilities
export const getFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }
  
  return { valid: true };
};

// Local storage utilities
export const setLocalStorage = (key: string, value: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error setting localStorage:', error);
  }
};

export const getLocalStorage = (key: string): any => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting localStorage:', error);
    return null;
  }
};

export const removeLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing localStorage:', error);
  }
};

// Array utilities
export const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Rating utilities
export const renderStars = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  
  return '★'.repeat(fullStars) + '☆'.repeat(halfStar) + '☆'.repeat(emptyStars);
};

// Content utilities
export const estimateReadingTime = (text: string, wordsPerMinute: number = 250): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
};

export const getReadingProgress = (currentPosition: number, totalLength: number): number => {
  if (totalLength === 0) return 0;
  return Math.round((currentPosition / totalLength) * 100);
};

// Theme utilities
export const getStatusColor = (status: string): string => {
  const statusColors: Record<string, string> = {
    draft: 'text-gray-600 bg-gray-100',
    published: 'text-green-600 bg-green-100',
    completed: 'text-blue-600 bg-blue-100',
    paused: 'text-yellow-600 bg-yellow-100',
  };
  return statusColors[status] || statusColors.draft;
};

// Social utilities
export const generateShareText = (title: string, author: string, url: string): string => {
  return `Check out "${title}" by ${author} on WriterPod! ${url}`;
};

export const generateShareUrl = (platform: 'twitter' | 'facebook' | 'linkedin', text: string, url: string): string => {
  const encodedText = encodeURIComponent(text);
  const encodedUrl = encodeURIComponent(url);
  
  switch (platform) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return url;
  }
};