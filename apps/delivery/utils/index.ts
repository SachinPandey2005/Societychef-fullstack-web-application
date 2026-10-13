/**
 * Format a number as Indian Rupee (INR) currency.
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format distance in meters to a readable string (e.g. "1.2 km" or "350 m").
 */
export const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
};

/**
 * Format time in minutes to a readable string (e.g. "25 mins" or "1 hr 10 mins").
 */
export const formatTime = (minutes: number): string => {
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr`;
  }
  return `${minutes} mins`;
};

/**
 * Capitalize first letter of a string.
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};
export default {
  formatCurrency,
  formatDistance,
  formatTime,
  capitalize,
};
