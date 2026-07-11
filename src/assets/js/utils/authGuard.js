import { getCurrentSession, getCurrentUserRole } from '../services/authService.js';

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.replace('./login.html');
  }
}

function redirectToHome() {
  if (typeof window !== 'undefined') {
    window.location.replace('./index.html');
  }
}

export async function requireAuth() {
  const { session } = await getCurrentSession();

  if (!session?.user) {
    redirectToLogin();
    return null;
  }

  return session.user;
}

export async function requireGuest() {
  const { session } = await getCurrentSession();

  if (session?.user) {
    redirectToHome();
    return null;
  }

  return null;
}

export async function requireAdmin() {
  const { session } = await getCurrentSession();

  if (!session?.user) {
    redirectToLogin();
    return null;
  }

  const { role } = await getCurrentUserRole();

  if (role !== 'admin') {
    redirectToHome();
    return null;
  }

  return session.user;
}
