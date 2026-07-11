export function renderNavbar(activePage = 'home') {
  const nav = document.querySelector('[data-navbar]');
  if (!nav) return;

  nav.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="index.html">ReceiptBook</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item"><a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="index.html">Home</a></li>
            <li class="nav-item"><a class="nav-link ${activePage === 'recipes' ? 'active' : ''}" href="recipes.html">Recipes</a></li>
            <li class="nav-item"><a class="nav-link ${activePage === 'login' ? 'active' : ''}" href="login.html">Login</a></li>
            <li class="nav-item"><a class="nav-link ${activePage === 'register' ? 'active' : ''}" href="register.html">Register</a></li>
            <li class="nav-item"><a class="nav-link ${activePage === 'profile' ? 'active' : ''}" href="profile.html">Profile</a></li>
          </ul>
        </div>
      </div>
    </nav>
  `;
}
