const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function createValidationResult(isValid, value, error) {
  return {
    isValid,
    value,
    error: isValid ? '' : error,
  };
}

export function validateRequiredText(value, fieldName = 'Field') {
  const text = String(value ?? '').trim();

  if (!text) {
    return createValidationResult(false, '', `${fieldName} is required.`);
  }

  return createValidationResult(true, text, '');
}

export function validatePositiveInteger(value, fieldName = 'Value') {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return createValidationResult(false, null, `${fieldName} is required.`);
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return createValidationResult(false, null, `${fieldName} must be a positive integer.`);
  }

  return createValidationResult(true, parsedValue, '');
}

export function validateEmail(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return createValidationResult(false, '', 'Email is required.');
  }

  if (!EMAIL_PATTERN.test(text)) {
    return createValidationResult(false, '', 'Please enter a valid email address.');
  }

  return createValidationResult(true, text, '');
}

export function validatePassword(value, options = {}) {
  const { fieldName = 'Password', minLength = 6 } = options;
  const text = String(value ?? '');

  if (!text) {
    return createValidationResult(false, '', `${fieldName} is required.`);
  }

  if (text.length < minLength) {
    return createValidationResult(false, '', `${fieldName} must be at least ${minLength} characters long.`);
  }

  return createValidationResult(true, text, '');
}

export function isValidEmail(email) {
  return EMAIL_PATTERN.test(String(email ?? '').trim());
}

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}
