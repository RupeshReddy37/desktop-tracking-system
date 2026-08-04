export function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function todayDate() {
  return isoDate(new Date());
}

export function yesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return isoDate(date);
}

export function daysAgoDate(days) {
  const date = new Date();
  date.setDate(date.getDate() - Number(days || 0));
  return isoDate(date);
}

export function displayHeaderDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date).replaceAll('/', '-');
}

export function rangeForTrend(mode) {
  const end = new Date();
  const start = new Date();

  if (mode === 'week') {
    start.setDate(end.getDate() - 6);
  } else if (mode === 'month') {
    start.setDate(1);
  } else if (mode === 'year') {
    start.setMonth(0, 1);
  }

  return { startDate: isoDate(start), endDate: isoDate(end) };
}

export function rangeForReport(groupBy) {
  const end = new Date();
  const start = new Date();

  if (groupBy === 'week') {
    start.setDate(end.getDate() - 6);
  } else if (groupBy === 'month') {
    start.setDate(1);
  }

  return { startDate: isoDate(start), endDate: isoDate(end) };
}


