/**
 * Indian Date Formatting Utilities
 * Formats dates in DD MMM YYYY format (05 Feb 2026)
 */

import { format, parseISO } from 'date-fns';

export function formatIndianDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM yyyy');
}

export function formatIndianDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM yyyy, hh:mm a');
}

export function formatIndianShortDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMM');
}

export function formatIndianMonthYear(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'MMM yyyy');
}

export function getCurrentFinancialYear(): { start: Date; end: Date } {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11

  // Indian financial year: April to March
  let fyStart: Date;
  let fyEnd: Date;

  if (currentMonth < 3) { // Jan, Feb, Mar
    fyStart = new Date(currentYear - 1, 3, 1); // Previous year April 1
    fyEnd = new Date(currentYear, 2, 31); // Current year March 31
  } else { // Apr to Dec
    fyStart = new Date(currentYear, 3, 1); // Current year April 1
    fyEnd = new Date(currentYear + 1, 2, 31); // Next year March 31
  }

  return { start: fyStart, end: fyEnd };
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateString = format(dateObj, 'yyyy-MM-dd');
  const todayString = format(today, 'yyyy-MM-dd');
  const yesterdayString = format(yesterday, 'yyyy-MM-dd');

  if (dateString === todayString) return 'Today';
  if (dateString === yesterdayString) return 'Yesterday';

  return formatIndianDate(dateObj);
}
