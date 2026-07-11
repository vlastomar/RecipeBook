export function formatTitle(value) {
  return value ? value.trim().replace(/\s+/g, ' ') : '';
}

export function getCurrentYear() {
  return new Date().getFullYear();
}
