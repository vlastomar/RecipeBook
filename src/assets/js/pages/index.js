import { getCurrentSession } from '../services/authService.js';
import { getPublishedRecipes } from '../services/recipeService.js';
import { getRecipeImagePublicUrl } from '../services/storageService.js';
import { escapeHtml } from '../utils/helpers.js';
import { showErrorAlert, clearAlert } from '../components/alerts.js';

const latestRecipesGrid = document.getElementById('latestRecipesGrid');
const latestRecipesStatus = document.getElementById('latestRecipesStatus');
const heroActions = document.getElementById('heroActions');

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

function renderHeroActions(isAuthenticated) {
  if (!heroActions) return;

  const primaryAction = isAuthenticated
    ? '<a class="btn btn-primary btn-lg" href="add-recipe.html"><i class="bi bi-plus-circle me-2"></i>Add Recipe</a>'
    : '<a class="btn btn-primary btn-lg" href="register.html"><i class="bi bi-person-plus-fill me-2"></i>Register</a>';

  const secondaryAction = '<a class="btn btn-outline-secondary btn-lg" href="recipes.html"><i class="bi bi-collection-play me-2"></i>Browse Recipes</a>';

  heroActions.innerHTML = `${primaryAction}${secondaryAction}`;
}

function renderRecipes(recipes) {
  if (!latestRecipesGrid) return;

  if (!recipes.length) {
    latestRecipesGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info mb-0" role="status">
          No published recipes are available yet.
        </div>
      </div>
    `;
    return;
  }

  latestRecipesGrid.innerHTML = recipes.map((recipe) => {
    const title = escapeHtml(recipe.title || 'Untitled recipe');
    const categoryName = escapeHtml(recipe.category?.name || 'Uncategorized');
    const description = escapeHtml(recipe.description || 'No description provided yet.');
    const imageDetails = getRecipeImageDetails(recipe);

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="card h-100 shadow-sm border-0">
          <img src="${imageDetails.imageUrl}" class="card-img-top" alt="${imageDetails.altText}" loading="lazy" style="height: 220px; object-fit: cover;" />
          <div class="card-body d-flex flex-column">
            <span class="badge text-bg-light text-secondary align-self-start mb-3">${categoryName}</span>
            <h3 class="h5 card-title">${title}</h3>
            <p class="card-text text-secondary flex-grow-1">${description}</p>
            <a class="btn btn-outline-primary mt-auto" href="recipe-details.html?id=${recipe.id}">
              View Details
              <i class="bi bi-arrow-right-short ms-1"></i>
            </a>
          </div>
        </article>
      </div>
    `;
  }).join('');
}

async function loadLatestRecipes() {
  if (latestRecipesGrid) {
    latestRecipesGrid.innerHTML = `
      <div class="col-12">
        <div class="d-flex align-items-center gap-2 text-secondary">
          <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          Loading latest recipes...
        </div>
      </div>
    `;
  }

  try {
    const recipes = await getPublishedRecipes({ sort: 'newest' });
    renderRecipes(recipes.slice(0, 3));
  } catch (error) {
    console.error('Unable to load latest recipes:', error);
    showErrorAlert(latestRecipesStatus, error.message || 'Unable to load latest recipes.');
    if (latestRecipesGrid) {
      latestRecipesGrid.innerHTML = '';
    }
  }
}

async function initializeHomePage() {
  try {
    const { session } = await getCurrentSession();
    renderHeroActions(Boolean(session?.user));
  } catch (error) {
    renderHeroActions(false);
  }

  await loadLatestRecipes();
}

initializeHomePage();