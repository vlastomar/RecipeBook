import { registerUser } from '../services/authService.js';

const form = document.getElementById('registerForm');
const messageContainer = document.getElementById('messageContainer');
const submitButton = document.getElementById('registerButton');

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type} mb-0" role="alert">
      ${message}
    </div>
  `;
}

function setSubmitting(isSubmitting) {
  if (!form || !submitButton) return;

  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? 'Registering...' : 'Register';
}

function validateForm() {
  const displayName = document.getElementById('displayName')?.value.trim() ?? '';
  const email = document.getElementById('email')?.value.trim() ?? '';
  const password = document.getElementById('password')?.value ?? '';
  const confirmPassword = document.getElementById('confirmPassword')?.value ?? '';

  if (!displayName) {
    throw new Error('Display name is required.');
  }

  if (!email) {
    throw new Error('Email is required.');
  }

  if (!/[A-Z0-9._%+-]+@[A-Z0-9.-]+/i.test(email)) {
    throw new Error('Please enter a valid email address.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  if (confirmPassword !== password) {
    throw new Error('Confirm password does not match.');
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    messageContainer.innerHTML = '';

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
