import { deleteRecipe, getRecipeById } from '../services/recipeService.js';
import { getCurrentSession, getCurrentUserRole } from '../services/authService.js';
import { getRecipeImagePublicUrl } from '../services/storageService.js';
import { escapeHtml, formatDate } from '../utils/helpers.js';
import { showAlert, clearAlert } from '../components/alerts.js';
import { Modal } from 'bootstrap';

const statusMessage = document.getElementById('statusMessage');
const loadingState = document.getElementById('loadingState');
const recipeContent = document.getElementById('recipeContent');
const deleteModalElement = document.getElementById('deleteModal');
const confirmDeleteButton = document.getElementById('confirmDeleteButton');

let currentRecipe = null;
let recipeToDelete = null;
let deleteModal = null;

function showStatus(message, type = 'danger') {
  if (!statusMessage) return;

  if (!message) {
    clearAlert(statusMessage);
    return;
  }

  showAlert(statusMessage, message, type);
}

function setLoading(isLoading) {
  if (loadingState) {
    loadingState.hidden = !isLoading;
  }
  if (recipeContent) {
    recipeContent.hidden = isLoading;
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

function renderRecipe(recipe, isOwnerOrAdmin) {
  if (!recipeContent) return;

  currentRecipe = recipe;

  const title = escapeHtml(recipe.title || 'Untitled recipe');
  const description = escapeHtml(recipe.description || 'No description provided yet.');
  const categoryName = escapeHtml(recipe.category?.name || 'Uncategorized');
  const ownerName = escapeHtml(recipe.owner?.display_name || 'Anonymous');
  const imageDetails = getRecipeImageDetails(recipe);
  const prepTime = recipe.preparation_minutes ? `${recipe.preparation_minutes} minutes` : 'Flexible';
  const servings = recipe.servings ? `${recipe.servings}` : 'Variable';
  const createdAt = escapeHtml(formatDate(recipe.created_at));
  const ingredients = escapeHtml(recipe.ingredients || '').replace(/\n/g, '<br />');
  const instructions = escapeHtml(recipe.instructions || '').replace(/\n/g, '<br />');

  recipeContent.innerHTML = `
    <div class="card shadow-sm">
      <img src="${imageDetails.imageUrl}" class="card-img-top img-fluid w-100" alt="${imageDetails.altText}" style="max-height: 420px; object-fit: cover;" />
      <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-2 mb-3">
          <div>
            <h1 class="h3 mb-2">${title}</h1>
            <p class="text-muted mb-0">${description}</p>
          </div>
          ${isOwnerOrAdmin ? `
            <div class="d-flex gap-2">
              <a class="btn btn-outline-secondary btn-sm" href="edit-recipe.html?id=${recipe.id}">Edit</a>
              <button class="btn btn-outline-danger btn-sm" type="button" data-action="delete-recipe">Delete</button>
            </div>
          ` : ''}
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-6">
            <p class="mb-2"><strong>Category:</strong> ${categoryName}</p>
            <p class="mb-2"><strong>Owner:</strong> ${ownerName}</p>
            <p class="mb-2"><strong>Preparation:</strong> ${prepTime}</p>
            <p class="mb-0"><strong>Servings:</strong> ${servings}</p>
          </div>
          <div class="col-md-6">
            <p class="mb-2"><strong>Created:</strong> ${createdAt}</p>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-12 col-lg-6">
            <h2 class="h5">Ingredients</h2>
            <div class="bg-light p-3 rounded">${ingredients}</div>
          </div>
          <div class="col-12 col-lg-6">
            <h2 class="h5">Instructions</h2>
            <div class="bg-light p-3 rounded">${instructions}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  recipeContent.hidden = false;
}

function openDeleteModal(recipeId) {
  recipeToDelete = recipeId;
  deleteModal?.show();
}

async function handleDeleteConfirmed() {
  if (!recipeToDelete) return;

  try {
    const result = await deleteRecipe(recipeToDelete);

    if (deleteModal) {
      deleteModal.hide();
    }

    recipeToDelete = null;

    if (result?.warning) {
      showAlert(statusMessage, result.warning, 'warning');
    } else {
      showAlert(statusMessage, 'Recipe deleted successfully.', 'success');
    }

    window.setTimeout(() => {
      window.location.replace('recipes.html');
    }, 1200);
  } catch (error) {
    showAlert(statusMessage, error.message || 'Unable to delete recipe.', 'danger');
  }
}

async function initializeRecipePage() {
  const params = new URLSearchParams(window.location.search);
  const recipeId = params.get('id');

  if (!recipeId) {
    setLoading(false);
    showStatus('Missing recipe id.', 'danger');
    return;
  }

  try {
    setLoading(true);
    clearAlert(statusMessage);

    const recipe = await getRecipeById(recipeId);

    if (!recipe) {
      setLoading(false);
      showAlert(statusMessage, 'Recipe not found.', 'warning');
      return;
    }

    const { session } = await getCurrentSession();
    const user = session?.user;
    let isOwnerOrAdmin = false;

    if (user) {
      const { role } = await getCurrentUserRole();
      isOwnerOrAdmin = user.id === recipe.user_id || role === 'admin';
    }

    renderRecipe(recipe, isOwnerOrAdmin);
  } catch (error) {
    setLoading(false);
    showAlert(statusMessage, error.message || 'Unable to load recipe.', 'danger');
  } finally {
    setLoading(false);
  }
}

if (deleteModalElement) {
  deleteModal = new Modal(deleteModalElement);
}

if (confirmDeleteButton) {
  confirmDeleteButton.addEventListener('click', handleDeleteConfirmed);
}

recipeContent?.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-action="delete-recipe"]');
  if (!deleteButton || !currentRecipe) return;

  openDeleteModal(currentRecipe.id);
});

initializeRecipePage();
