import { getPublishedRecipes } from '../services/recipeService.js';
import { getCategories } from '../services/categoryService.js';
import { getRecipeImagePublicUrl } from '../services/storageService.js';

const recipesList = document.getElementById('recipesList');
const filtersForm = document.getElementById('filtersForm');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');
const statusMessage = document.getElementById('statusMessage');
const loadingElement = document.getElementById('recipesLoading');
const clearButton = document.getElementById('clearButton');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showStatus(message, type = 'danger') {
  if (!statusMessage) return;

  statusMessage.innerHTML = `
    <div class="alert alert-${type} mb-0" role="alert">
      ${message}
    </div>
  `;
}

function clearStatus() {
  if (statusMessage) {
    statusMessage.innerHTML = '';
  }
}

function setLoading(isLoading) {
  if (loadingElement) {
    loadingElement.hidden = !isLoading;
  }
}

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';

function getRecipeImageDetails(recipe) {
  const title = recipe?.title || 'Recipe';
  const altText = escapeHtml(`Photo of ${title}`);

  if (recipe?.image_path) {
    try {
      const publicUrl = getRecipeImagePublicUrl(recipe.image_path);
      return {
        imageUrl: publicUrl || FALLBACK_IMAGE_URL,
        altText,
      };
    } catch (error) {
      console.error('Unable to resolve recipe image URL:', error);
    }
  }

  return {
    imageUrl: FALLBACK_IMAGE_URL,
    altText,
  };
}

function renderRecipes(recipes) {
  if (!recipesList) return;

  if (!recipes.length) {
    recipesList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info mb-0" role="status">
          No recipes found. Try a different search or come back later.
        </div>
      </div>
    `;
    return;
  }

  recipesList.innerHTML = recipes.map((recipe) => {
    const categoryName = recipe.category?.name || 'Uncategorized';
    const ownerName = recipe.owner?.display_name || 'Anonymous';
    const imageDetails = getRecipeImageDetails(recipe);
    const description = recipe.description ? escapeHtml(recipe.description) : 'No description provided yet.';
    const title = escapeHtml(recipe.title || 'Untitled recipe');
    const safeCategory = escapeHtml(categoryName);
    const safeOwner = escapeHtml(ownerName);
    const prepTime = recipe.preparation_minutes ? `${recipe.preparation_minutes} min` : 'Flexible';
    const servings = recipe.servings ? `${recipe.servings} servings` : 'Serves variable';

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="card shadow-sm h-100">
          <img src="${imageDetails.imageUrl}" class="card-img-top img-fluid w-100" alt="${imageDetails.altText}" loading="lazy" style="height: 220px; object-fit: cover;" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h5 class="card-title mb-0">${title}</h5>
              <span class="badge bg-secondary">${safeCategory}</span>
            </div>
            <p class="card-text text-muted flex-grow-1">${description}</p>
            <ul class="list-unstyled small mb-3">
              <li><i class="bi bi-clock me-2"></i>${prepTime}</li>
              <li><i class="bi bi-people me-2"></i>${servings}</li>
              <li><i class="bi bi-person me-2"></i>${safeOwner}</li>
            </ul>
            <a class="btn btn-outline-primary mt-auto" href="recipe-details.html?id=${recipe.id}">View Details</a>
          </div>
        </article>
      </div>
    `;
  }).join('');
}

async function populateCategoryFilter() {
  if (!categoryFilter) return;

  try {
    const categories = await getCategories();
    categoryFilter.innerHTML = '<option value="">All categories</option>' + categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join('');
  } catch (error) {
    console.error('Unable to load categories:', error);
  }
}

async function loadRecipes() {
  setLoading(true);
  clearStatus();
  recipesList.innerHTML = '';

  try {
    const options = {
      search: searchInput?.value.trim() || '',
      category: categoryFilter?.value || '',
      sort: sortSelect?.value || 'newest',
    };

    const recipes = await getPublishedRecipes(options);
    renderRecipes(recipes);
  } catch (error) {
    showStatus(error.message || 'Unable to load recipes.', 'danger');
    recipesList.innerHTML = '';
  } finally {
    setLoading(false);
  }
}

if (filtersForm) {
  filtersForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadRecipes();
  });
}

if (clearButton) {
  clearButton.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    loadRecipes();
  });
}

populateCategoryFilter();
loadRecipes();
