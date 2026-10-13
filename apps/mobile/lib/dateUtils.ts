import { DayKey } from '../types';

export interface CalendarDateItem {
  dateStr: string; // "YYYY-MM-DD"
  dayKey: DayKey;  // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  dayName: string; // "Monday", "Tuesday", etc.
  dateNum: number; // e.g. 4
  monthName: string; // "Aug"
  displayLabel: string; // "Today, 4 Aug", "Tomorrow, 5 Aug", "Thu, 6 Aug"
  shortLabel: string; // "Tue 4"
  isToday: boolean;
  isTomorrow: boolean;
  isCurrentWeek: boolean;
  fullDate: Date;
}

const DAY_KEYS: DayKey[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayISODate(): string {
  return toISODateString(new Date());
}

export function getWeekDates(startDate?: Date, numDays: number = 30): CalendarDateItem[] {
  const start = startDate ? new Date(startDate) : new Date();
  start.setHours(0, 0, 0, 0);

  const todayStr = getTodayISODate();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toISODateString(tomorrow);

  const list: CalendarDateItem[] = [];

  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);

    const dateStr = toISODateString(d);
    const dayIdx = d.getDay(); // 0 is Sun
    const dayKey = (DAY_KEYS[dayIdx] === 'Sun' ? 'Sun' : DAY_KEYS[dayIdx]) as DayKey;
    const dayName = DAY_NAMES[dayIdx];
    const dateNum = d.getDate();
    const monthName = MONTH_NAMES[d.getMonth()];

    const isToday = dateStr === todayStr;
    const isTomorrow = dateStr === tomorrowStr;
    const isCurrentWeek = i < 7;

    let displayLabel = `${dayKey}, ${dateNum} ${monthName}`;
    if (isToday) displayLabel = `Today, ${dateNum} ${monthName}`;
    else if (isTomorrow) displayLabel = `Tomorrow, ${dateNum} ${monthName}`;

    list.push({
      dateStr,
      dayKey,
      dayName,
      dateNum,
      monthName,
      displayLabel,
      shortLabel: `${dayKey} ${dateNum}`,
      isToday,
      isTomorrow,
      isCurrentWeek,
      fullDate: d,
    });
  }

  return list;
}

export function formatNiceDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;

  const dateObj = new Date(y, m - 1, d);
  const todayStr = getTodayISODate();
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toISODateString(tomorrow);

  const dayKey = DAY_KEYS[dateObj.getDay()];
  const monthName = MONTH_NAMES[dateObj.getMonth()];

  if (dateStr === todayStr) return `Today (${d} ${monthName})`;
  if (dateStr === tomorrowStr) return `Tomorrow (${d} ${monthName})`;
  return `${dayKey}, ${d} ${monthName}`;
}
