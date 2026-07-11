export function showAlert(message, type = 'info') {
  const container = document.querySelector('[data-alerts]');
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type} mt-3" role="alert">
      ${message}
    </div>
  `;
}
