import { loginUser, getCurrentSession } from '../services/authService.js';

const form = document.getElementById('loginForm');
const messageContainer = document.getElementById('messageContainer');
const submitButton = document.getElementById('loginButton');

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type} mb-0" role="alert">
      ${message}
    </div>
  `;
}

function setSubmitting(isSubmitting) {
  if (!submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Signing In...' : 'Sign In';
}

function validateForm() {
  const email = document.getElementById('email')?.value.trim() ?? '';
  const password = document.getElementById('password')?.value ?? '';

  if (!email) {
    throw new Error('Email is required.');
  }

  if (!password) {
    throw new Error('Password is required.');
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
    messageContainer.innerHTML = '';

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
