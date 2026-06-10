import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatImageUrl(url: string | undefined): string {
  if (!url) return '';
  // Convert Google Drive view links to direct image links
  const driveRegex = /drive\.google\.com\/file\/d\/([^\/]+)/;
  const match = url.match(driveRegex);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
}
