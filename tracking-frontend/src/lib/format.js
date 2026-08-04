export function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatDateTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const formatted = new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);

  return formatted.replace(/\b(am|pm)\b/i, (match) => match.toUpperCase());
}

export function formatRelativeTime(value) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60000));

  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ${minutes % 60}m ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
}

export function formatCompactDuration(totalSeconds) {
  const value = Number(totalSeconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);

  if (hours <= 0 && minutes <= 0) {
    return '0m';
  }

  if (hours <= 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function formatExactDuration(totalSeconds) {
  const value = Number(totalSeconds || 0);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-IN').format(Number(value || 0));
}

export function normalizeStatus(status) {
  return (status || 'UNKNOWN').toString().toUpperCase();
}

export function statusTone(status) {
  switch (normalizeStatus(status)) {
    case 'ACTIVE':
      return 'tone-green';
    case 'IDLE':
      return 'tone-amber';
    case 'LOCKED':
      return 'tone-purple';
    case 'OFFLINE':
      return 'tone-gray';
    case 'NOT_REGISTERED':
      return 'tone-red';
    default:
      return 'tone-slate';
  }
}

export function confidenceTone(confidence) {
  const value = (confidence || '').toString().toLowerCase();
  if (value.includes('high')) {
    return 'tone-red';
  }
  if (value.includes('medium')) {
    return 'tone-amber';
  }
  if (value.includes('low')) {
    return 'tone-green';
  }
  return 'tone-slate';
}

export function safeText(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

export function combineName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || '-';
}
