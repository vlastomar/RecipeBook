import { loginUser, getCurrentSession } from '../services/authService.js';
import { validateRequiredText } from '../utils/validators.js';
import { showErrorAlert, clearAlert } from '../components/alerts.js';

const form = document.getElementById('loginForm');
const messageContainer = document.getElementById('messageContainer');
const submitButton = document.getElementById('loginButton');

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  if (!message) {
    clearAlert(messageContainer);
    return;
  }

  showErrorAlert(messageContainer, message);
}

function setSubmitting(isSubmitting) {
  if (!submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Signing In...' : 'Sign In';
}

function validateForm() {
  const emailValidation = validateRequiredText(document.getElementById('email')?.value, 'Email');
  const passwordValidation = validateRequiredText(document.getElementById('password')?.value, 'Password');

  if (!emailValidation.isValid) {
    throw new Error(emailValidation.error);
  }

  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.error);
  }
}

async function redirectIfLoggedIn() {
  try {
    const { session } = await getCurrentSession();
    if (session) {
      window.location.replace('index.html');
    }
  } catch (error) {
    console.error('Unable to determine auth state:', error);
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearAlert(messageContainer);

    try {
      validateForm();
      setSubmitting(true);

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      await loginUser(email, password);
      window.location.replace('index.html');
    } catch (error) {
      showMessage(error.message || 'Login failed. Please try again.', 'danger');
    } finally {
      setSubmitting(false);
    }
  });
}

redirectIfLoggedIn();
