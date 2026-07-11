import { registerUser } from '../services/authService.js';
import { validateRequiredText, validateEmail, validatePassword } from '../utils/validators.js';
import { showErrorAlert, showSuccessAlert, clearAlert } from '../components/alerts.js';

const form = document.getElementById('registerForm');
const messageContainer = document.getElementById('messageContainer');
const submitButton = document.getElementById('registerButton');

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  if (!message) {
    clearAlert(messageContainer);
    return;
  }

  if (type === 'success') {
    showSuccessAlert(messageContainer, message);
    return;
  }

  showErrorAlert(messageContainer, message);
}

function setSubmitting(isSubmitting) {
  if (!form || !submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Registering...' : 'Register';
}

function validateForm() {
  const displayNameValidation = validateRequiredText(document.getElementById('displayName')?.value, 'Display name');
  const emailValidation = validateEmail(document.getElementById('email')?.value);
  const passwordValidation = validatePassword(document.getElementById('password')?.value);
  const confirmPassword = document.getElementById('confirmPassword')?.value ?? '';

  if (!displayNameValidation.isValid) {
    throw new Error(displayNameValidation.error);
  }

  if (!emailValidation.isValid) {
    throw new Error(emailValidation.error);
  }

  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.error);
  }

  if (confirmPassword !== document.getElementById('password')?.value) {
    throw new Error('Confirm password does not match.');
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(messageContainer);

    try {
      validateForm();
      setSubmitting(true);

      const displayName = document.getElementById('displayName').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      await registerUser(email, password, displayName);

      showMessage('Registration successful. Redirecting to login...', 'success');
      window.setTimeout(() => {
        window.location.href = 'login.html';
      }, 1000);
    } catch (error) {
      showMessage(error.message || 'Registration failed. Please try again.', 'danger');
    } finally {
      setSubmitting(false);
    }
  });
}
