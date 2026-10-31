// ============================================
// Date Utilities
// ============================================

/**
 * Returns today's date in YYYY-MM-DD format
 */
export function today() {
  const d = new Date();
  return formatISO(d);
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function formatISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if current time is before the QR cutoff (9:00 AM local)
 */
export function isBeforeQRCutoff() {
  const now = new Date();
  return now.getHours() < 9;
}

/**
 * Get the start (Monday) and end (Sunday) of the week containing the given date
 */
export function getWeekRange(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  const day = date.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(date);
  monday.setDate(date.getDate() + diffToMonday);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: formatISO(monday),
    end: formatISO(sunday),
  };
}

/**
 * Get start and end dates of a month
 */
export function getMonthRange(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start: startDate, end: endDate };
}

/**
 * Get the number of days in a given month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Format date as human-readable string (e.g., "Lun 10 Ago")
 */
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MONTHS_FULL = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return `${DAYS_SHORT[date.getDay()]} ${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return `${date.getDate()} de ${MONTHS_FULL[date.getMonth()]} de ${date.getFullYear()}`;
}

export function getMonthName(month) {
  return MONTHS_FULL[month - 1];
}

export function getMonthNameShort(month) {
  return MONTHS_SHORT[month - 1];
}

export function getDayName(dateStr) {
  const date = new Date(dateStr + 'T12:00:00');
  return DAYS_SHORT[date.getDay()];
}

/**
 * Get the day of the week (0=Sunday, 1=Monday, ...)
 */
export function getDayOfWeek(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay();
}

/**
 * Check if date is Saturday or Sunday
 */
export function isWeekend(dateStr) {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
}

/**
 * Navigate week forward/backward
 */
export function shiftWeek(dateStr, direction) {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + (direction * 7));
  return formatISO(date);
}

/**
 * Navigate month forward/backward
 */
export function shiftMonth(year, month, direction) {
  let newMonth = month + direction;
  let newYear = year;
  if (newMonth > 12) { newMonth = 1; newYear++; }
  if (newMonth < 1) { newMonth = 12; newYear--; }
  return { year: newYear, month: newMonth };
}

/**
 * Get all dates in a week range
 */
export function getWeekDates(startDate) {
  const dates = [];
  const start = new Date(startDate + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(formatISO(d));
  }
  return dates;
}
