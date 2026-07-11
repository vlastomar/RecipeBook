export function renderFooter() {
  let footer = document.getElementById('app-footer');

  if (!footer) {
    footer = document.querySelector('[data-footer]');
  }

  if (!footer) {
    footer = document.createElement('div');
    footer.id = 'app-footer';
    document.body.appendChild(footer);
  } else if (footer.id !== 'app-footer') {
    footer.id = 'app-footer';
  }

  const year = new Date().getFullYear();

  footer.innerHTML = `
    <footer class="bg-dark text-white py-4 mt-5">
      <div class="container">
        <div class="row align-items-center g-3">
          <div class="col-12 col-md-6 text-center text-md-start">
            <p class="mb-0 fw-semibold">RecipeBook &copy; ${year}</p>
          </div>
          <div class="col-12 col-md-6 text-center text-md-end">
            <a class="text-white text-decoration-none me-3" href="./index.html">Home</a>
            <a class="text-white text-decoration-none" href="./recipes.html">Recipes</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}
