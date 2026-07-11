export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString();
}

export function getQueryParameter(name, fallback = null) {
  if (!name) return fallback;

  const params = new URLSearchParams(window.location.search);
  return params.get(name) ?? fallback;
}

export function truncateText(value, maxLength = 120, suffix = '...') {
  const text = String(value ?? '');

  if (!Number.isFinite(maxLength) || maxLength <= 0) {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}${suffix}`;
}

export function formatTitle(value) {
  return value ? value.trim().replace(/\s+/g, ' ') : '';
}

export function getCurrentYear() {
  return new Date().getFullYear();
}
