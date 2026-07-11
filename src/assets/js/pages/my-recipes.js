import { requireAuth } from '../utils/authGuard.js';
import { getCurrentUserRecipes, deleteRecipe } from '../services/recipeService.js';
import { getRecipeImagePublicUrl } from '../services/storageService.js';
import { Modal } from 'bootstrap';
import { escapeHtml, formatDate } from '../utils/helpers.js';
import { showAlert, clearAlert } from '../components/alerts.js';

const recipesList = document.getElementById('recipesList');
const loadingState = document.getElementById('loadingState');
const messageContainer = document.getElementById('messageContainer');
const deleteModalElement = document.getElementById('deleteModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');

let recipes = [];
let recipeToDelete = null;
let deleteModal = null;

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  if (!message) {
    clearAlert(messageContainer);
    return;
  }

  showAlert(messageContainer, message, type);
}

function setLoading(isLoading) {
  if (loadingState) {
    loadingState.hidden = !isLoading;
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

function renderRecipes() {
  if (!recipesList) return;

  if (!recipes.length) {
    recipesList.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info mb-0" role="status">
          You have not created any recipes yet.
        </div>
      </div>
    `;
    return;
  }

  recipesList.innerHTML = recipes.map((recipe) => {
    const title = escapeHtml(recipe.title || 'Untitled recipe');
    const categoryName = escapeHtml(recipe.category?.name || 'Uncategorized');
    const status = recipe.is_published ? 'Published' : 'Draft';
    const imageDetails = getRecipeImageDetails(recipe);
    const createdAt = formatDate(recipe.created_at);

    return `
      <div class="col-12 col-md-6 col-lg-4">
        <article class="card shadow-sm h-100">
          <img src="${imageDetails.imageUrl}" class="card-img-top img-fluid w-100" alt="${imageDetails.altText}" loading="lazy" style="height: 220px; object-fit: cover;" />
          <div class="card-body d-flex flex-column">
            <div class="d-flex justify-content-between align-items-start gap-2 mb-2">
              <h5 class="card-title mb-0">${title}</h5>
              <span class="badge ${recipe.is_published ? 'bg-success' : 'bg-secondary'}">${escapeHtml(status)}</span>
            </div>
            <p class="text-muted small mb-3">Category: ${categoryName}</p>
            <p class="text-muted small mb-3">Created: ${escapeHtml(createdAt)}</p>
            <div class="d-flex flex-wrap gap-2 mt-auto">
              <a class="btn btn-outline-primary btn-sm" href="recipe-details.html?id=${recipe.id}">View</a>
              <a class="btn btn-outline-secondary btn-sm" href="edit-recipe.html?id=${recipe.id}">Edit</a>
              <button class="btn btn-outline-danger btn-sm" data-action="delete" data-recipe-id="${recipe.id}">Delete</button>
            </div>
          </div>
        </article>
      </div>
    `;
  }).join('');
}

async function loadRecipes() {
  setLoading(true);
  showMessage('');

  try {
    const user = await requireAuth();
    if (!user) return;

    recipes = await getCurrentUserRecipes();
    renderRecipes();
  } catch (error) {
    showMessage(error.message || 'Unable to load your recipes.', 'danger');
  } finally {
    setLoading(false);
  }
}

function attachDeleteHandlers() {
  recipesList?.querySelectorAll('[data-action="delete"]').forEach((button) => {
    button.addEventListener('click', () => {
      recipeToDelete = button.getAttribute('data-recipe-id');
      if (deleteModal) {
        deleteModal.show();
      }
    });
  });
}

async function handleDeleteConfirmed() {
  if (!recipeToDelete) return;

  try {
    const result = await deleteRecipe(recipeToDelete);
    if (deleteModal) {
      deleteModal.hide();
    }
    recipeToDelete = null;
    await loadRecipes();

    if (result?.warning) {
      showMessage(result.warning, 'warning');
    } else {
      showMessage('Recipe deleted successfully.', 'success');
    }
  } catch (error) {
    showMessage(error.message || 'Unable to delete recipe.', 'danger');
  }
}

if (deleteModalElement) {
  deleteModal = new Modal(deleteModalElement);
}

if (confirmDeleteButton) {
  confirmDeleteButton.addEventListener('click', handleDeleteConfirmed);
}

recipesList?.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-action="delete"]');
  if (!deleteButton) return;

  recipeToDelete = deleteButton.getAttribute('data-recipe-id');
  if (deleteModal) {
    deleteModal.show();
  }
});

loadRecipes();
