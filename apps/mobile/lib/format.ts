import type { Dish, OrderStatus } from '../types';

export function money(value: number): string {
  return `₹${Math.round(value)}`;
}

export function getRatingColor(rating: number | string): string {
  const numericRating = typeof rating === 'number' ? rating : parseFloat(String(rating)) || 0;
  if (numericRating >= 4.0) return '#386641'; // Green (High / Excellent)
  if (numericRating >= 3.0) return '#E87D3E'; // Orange (Average / Medium)
  return '#C84B31'; // Red (Below Average / Low)
}

export function findDish(id: string, dishes: Dish[]): Dish | undefined {
  return dishes.find((dish) => dish.id === id);
}

export function getLeadTimeLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  return `${hours} hr${hours !== 1 ? 's' : ''}`;
}

export function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return '#66736c';
    case 'accepted':
      return '#285a7f';
    case 'preparing':
      return '#d99825';
    case 'ready':
      return '#146b4b';
    case 'out_for_delivery':
      return '#146b4b';
    case 'delivered':
      return '#0f513a';
    case 'cancelled':
      return '#c94737';
    default:
      return '#66736c';
  }
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'placed':
      return 'Placed';
    case 'accepted':
      return 'Accepted';
    case 'preparing':
      return 'Preparing';
    case 'ready':
      return 'Ready';
    case 'out_for_delivery':
      return 'Out for delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getEtaLabel(minutes: number): string {
  if (minutes < 60) {
    return `Ready in ~${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  return `Ready in ~${hours} hr${hours !== 1 ? 's' : ''}`;
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 30) return 'just now';
  if (diffSec < 60) return `${diffSec} sec ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hr${diffHour !== 1 ? 's' : ''} ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatPhone(phone: string): string {
  // Strip everything except digits
  const digits = phone.replace(/\D/g, '');

  // Handle +91 country code prefix
  const local = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits;

  if (local.length === 10) {
    return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
  }

  // Return as-is if pattern doesn't match
  return phone;
}
