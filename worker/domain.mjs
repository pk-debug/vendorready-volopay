// Pure functions used by the backend. No network, framework, or AI dependencies.
export const isValidISODate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const dt = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(dt.getTime()) && dt.toISOString().slice(0, 10) === value;
};

export const calculateProgress = (items) => {
  const total = items.length;
  const complete = items.filter(item => Boolean(item.is_completed)).length;
  return { complete, total, percent: total ? Math.round(100 * complete / total) : 0,
    status: total && total === complete ? 'ready' : complete ? 'in_progress' : 'not_started' };
};

export function safeText(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
