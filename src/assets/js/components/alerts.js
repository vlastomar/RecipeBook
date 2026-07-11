function resolveContainer(containerOrSelector) {
  if (!containerOrSelector) {
    return document.querySelector('[data-alerts]');
  }

  if (typeof containerOrSelector === 'string') {
    return document.querySelector(containerOrSelector);
  }

  return containerOrSelector;
}

export function clearAlert(containerOrSelector) {
  const container = resolveContainer(containerOrSelector);
  if (!container) return;

  container.replaceChildren();
}

export function renderAlert(containerOrSelector, message, type = 'info', options = {}) {
  const container = resolveContainer(containerOrSelector);
  if (!container) return null;

  const text = String(message ?? '');

  if (!text) {
    clearAlert(container);
    return null;
  }

  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type} ${options.className || ''}`.trim();
  alertElement.setAttribute('role', options.role || 'alert');
  alertElement.textContent = text;

  container.replaceChildren(alertElement);

  if (Number.isFinite(options.autoDismissMs) && options.autoDismissMs > 0) {
    window.setTimeout(() => {
      if (alertElement.isConnected) {
        alertElement.remove();
      }

      if (container.isConnected && !container.children.length) {
        container.replaceChildren();
      }
    }, options.autoDismissMs);
  }

  return alertElement;
}

export function showSuccessAlert(containerOrSelector, message, options = {}) {
  return renderAlert(containerOrSelector, message, 'success', options);
}

export function showWarningAlert(containerOrSelector, message, options = {}) {
  return renderAlert(containerOrSelector, message, 'warning', options);
}

export function showErrorAlert(containerOrSelector, message, options = {}) {
  return renderAlert(containerOrSelector, message, 'danger', options);
}

export function showAlert(containerOrSelector, message, type = 'info', options = {}) {
  return renderAlert(containerOrSelector, message, type, options);
}
