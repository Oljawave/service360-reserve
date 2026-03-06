
export function parseLocalDate(dateString) {
  if (!dateString) return null;

  const [year, month, day] = dateString.split('T')[0].split('-');
  return new Date(year, month - 1, day);
}

export function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDaysDifference(date1, date2) {
  const diffTime = date1.getTime() - date2.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function isOverdue(dateString, compareDate = null) {
  if (!dateString) return false;

  const date = parseLocalDate(dateString);
  const today = compareDate || getTodayStart();

  return date.getTime() < today.getTime();
}

export function formatDate(date) {
  if (!date || !(date instanceof Date)) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDateHuman(date) {
  if (!date) return '';

  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  if (!dateObj) return '';

  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();

  return `${day}.${month}.${year}`;
}

export function isToday(date) {
  if (!date) return false;

  const dateObj = typeof date === 'string' ? parseLocalDate(date) : date;
  const today = getTodayStart();

  return dateObj.getTime() === today.getTime();
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isValidDate(dateString) {
  if (!dateString) return false;

  const date = parseLocalDate(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}
