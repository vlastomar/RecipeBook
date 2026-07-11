import { getCurrentSession, getCurrentUserRole, logoutUser } from '../services/authService.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getNavbarContainer() {
  let container = document.getElementById('app-navbar');

  if (!container) {
    container = document.querySelector('[data-navbar]');
  }

  if (!container) {
    container = document.createElement('div');
    container.id = 'app-navbar';
    document.body.prepend(container);
    return container;
  }

  if (container.id !== 'app-navbar') {
    container.id = 'app-navbar';
  }

  return container;
}

function buildLink(page, label, activePage) {
  const href = `./${page}`;
  const isActive = activePage === page.replace('.html', '');

  return `
    <li class="nav-item">
      <a class="nav-link ${isActive ? 'active' : ''}" href="${href}">${label}</a>
    </li>
  `;
}

function buildNavbarHtml(activePage, session, role) {
  const isAuthenticated = Boolean(session?.user);
  const isAdmin = role === 'admin';
  const displayName = session?.user?.user_metadata?.display_name || session?.user?.email || '';
  const safeDisplayName = escapeHtml(displayName);

  const links = [];
  links.push(buildLink('index.html', 'Home', activePage));
  links.push(buildLink('recipes.html', 'Recipes', activePage));

  if (isAuthenticated) {
    links.push(buildLink('add-recipe.html', 'Add Recipe', activePage));
    links.push(buildLink('my-recipes.html', 'My Recipes', activePage));
    links.push(buildLink('profile.html', 'Profile', activePage));
    if (isAdmin) {
      links.push(buildLink('admin.html', 'Admin Panel', activePage));
    }
  } else {
    links.push(buildLink('login.html', 'Login', activePage));
    links.push(buildLink('register.html', 'Register', activePage));
  }

  const authControl = isAuthenticated
    ? `
      <li class="nav-item d-flex align-items-center">
        <span class="navbar-text text-light me-3">Hello, ${safeDisplayName}</span>
        <button type="button" class="btn btn-outline-light btn-sm" data-action="logout">Logout</button>
      </li>
    `
    : '';

  return `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="./index.html">ReceiptBook</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto align-items-lg-center">
            ${links.join('')}
            ${authControl}
          </ul>
        </div>
      </div>
    </nav>
  `;
}

function attachLogoutHandler(container) {
  const logoutButton = container.querySelector('[data-action="logout"]');
  if (!logoutButton) return;

  logoutButton.addEventListener('click', async (event) => {
    event.preventDefault();
    try {
      await logoutUser();
    } finally {
      window.location.replace('./login.html');
    }
  });
}

export async function renderNavbar(activePage = 'home') {
  const container = getNavbarContainer();

  try {
    const { session } = await getCurrentSession();
    let role = null;

    if (session?.user) {
      const { role: userRole } = await getCurrentUserRole();
      role = userRole;
    }

    container.innerHTML = buildNavbarHtml(activePage, session, role);
    attachLogoutHandler(container);
  } catch (error) {
    container.innerHTML = buildNavbarHtml(activePage, null, null);
    attachLogoutHandler(container);
  }
}
