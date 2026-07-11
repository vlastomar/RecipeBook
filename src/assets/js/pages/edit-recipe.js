import { requireAuth } from '../utils/authGuard.js';
import { getRecipeById, updateRecipe } from '../services/recipeService.js';
import { getCategories } from '../services/categoryService.js';
import { getCurrentUserRole } from '../services/authService.js';
import { validateImageFile, uploadRecipeImage, deleteRecipeImage, getRecipeImagePublicUrl } from '../services/storageService.js';

const form = document.getElementById('recipeForm');
const messageContainer = document.getElementById('messageContainer');
const saveButton = document.getElementById('saveButton');
const categorySelect = document.getElementById('category');
const recipeImageInput = document.getElementById('recipeImage');
const removeCurrentImageCheckbox = document.getElementById('removeCurrentImage');
const currentImageContainer = document.getElementById('currentImageContainer');
const currentImagePreview = document.getElementById('currentImagePreview');

let currentRecipe = null;

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${message}
    </div>
  `;
}

function setSaving(isSaving) {
  if (!saveButton || !form) return;

  const controls = form.querySelectorAll('input, select, textarea, button');
  controls.forEach((control) => {
    if (control !== saveButton) {
      control.disabled = isSaving;
    }
  });

  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving ? 'Saving...' : 'Save Changes';
}

function getRecipeIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function validateForm() {
  const title = document.getElementById('title')?.value.trim() ?? '';
  const category = categorySelect?.value ?? '';
  const ingredients = document.getElementById('ingredients')?.value.trim() ?? '';
  const instructions = document.getElementById('instructions')?.value.trim() ?? '';
  const preparationMinutes = document.getElementById('preparationMinutes')?.value;
  const servings = document.getElementById('servings')?.value;

  if (!title) {
    throw new Error('Title is required.');
  }

  if (!category) {
    throw new Error('Category is required.');
  }

  if (!ingredients) {
    throw new Error('Ingredients are required.');
  }

  if (!instructions) {
    throw new Error('Instructions are required.');
  }

  if (preparationMinutes !== '' && preparationMinutes !== null && Number(preparationMinutes) <= 0) {
    throw new Error('Preparation minutes must be positive when provided.');
  }

  if (servings !== '' && servings !== null && Number(servings) <= 0) {
    throw new Error('Servings must be positive when provided.');
  }
}

async function populateCategories() {
  if (!categorySelect) return;

  try {
    const categories = await getCategories();
    categorySelect.innerHTML = '<option value="">Select a category</option>' + categories.map((category) => `<option value="${category.id}">${category.name}</option>`).join('');
  } catch (error) {
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    console.error('Unable to load categories:', error);
  }
}

function renderCurrentImage() {
  if (!currentImageContainer || !currentImagePreview) return;

  if (currentRecipe?.image_path) {
    try {
      const publicUrl = getRecipeImagePublicUrl(currentRecipe.image_path);
      currentImageContainer.classList.remove('d-none');
      currentImagePreview.src = publicUrl || '';
      currentImagePreview.alt = currentRecipe.title ? `Current image for ${currentRecipe.title}` : 'Current recipe image';
    } catch (error) {
      currentImageContainer.classList.add('d-none');
      currentImagePreview.src = '';
      currentImagePreview.alt = '';
    }
  } else {
    currentImageContainer.classList.add('d-none');
    currentImagePreview.src = '';
    currentImagePreview.alt = '';
  }
}

function prefillForm(recipe) {
  if (!recipe) return;

  document.getElementById('title').value = recipe.title || '';
  document.getElementById('description').value = recipe.description || '';
  document.getElementById('ingredients').value = recipe.ingredients || '';
  document.getElementById('instructions').value = recipe.instructions || '';
  document.getElementById('preparationMinutes').value = recipe.preparation_minutes ?? '';
  document.getElementById('servings').value = recipe.servings ?? '';
  document.getElementById('published').checked = recipe.is_published ?? true;

  if (categorySelect && recipe.category_id) {
    categorySelect.value = String(recipe.category_id);
  }

  renderCurrentImage();
}

async function initializePage() {
  const user = await requireAuth();
  if (!user) return;

  const recipeId = getRecipeIdFromUrl();

  if (!recipeId) {
    showMessage('Missing recipe id.', 'danger');
    return;
  }

  try {
    await populateCategories();
    currentRecipe = await getRecipeById(recipeId);

    if (!currentRecipe) {
      showMessage('Recipe not found.', 'warning');
      return;
    }

    const { role } = await getCurrentUserRole();
    const isAuthorized = user.id === currentRecipe.user_id || role === 'admin';

    if (!isAuthorized) {
      window.location.replace('my-recipes.html');
      return;
    }

    prefillForm(currentRecipe);
  } catch (error) {
    showMessage(error.message || 'Unable to load recipe.', 'danger');
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    let uploadedImagePath = null;
    let shouldDeleteOldImage = false;

    try {
      validateForm();
      setSaving(true);

      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const ingredients = document.getElementById('ingredients').value.trim();
      const instructions = document.getElementById('instructions').value.trim();
      const preparationMinutes = document.getElementById('preparationMinutes').value;
      const servings = document.getElementById('servings').value;
      const published = document.getElementById('published').checked;
      const removeCurrentImage = removeCurrentImageCheckbox?.checked ?? false;
      const selectedFile = recipeImageInput?.files?.[0] ?? null;

      let nextImagePath = currentRecipe?.image_path ?? null;

      if (removeCurrentImage) {
        nextImagePath = null;
        shouldDeleteOldImage = Boolean(currentRecipe?.image_path);
      } else if (selectedFile) {
        const validation = validateImageFile(selectedFile);

        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const uploadResult = await uploadRecipeImage(selectedFile);
        uploadedImagePath = uploadResult.filePath;
        nextImagePath = uploadedImagePath;
        shouldDeleteOldImage = Boolean(currentRecipe?.image_path);
      }

      const payload = {
        title,
        description: description || null,
        ingredients,
        instructions,
        category_id: categorySelect?.value ? Number(categorySelect.value) : null,
        preparation_minutes: preparationMinutes ? Number(preparationMinutes) : null,
        servings: servings ? Number(servings) : null,
        image_path: nextImagePath,
        is_published: published,
      };

      const updatedRecipe = await updateRecipe(currentRecipe.id, payload);

      if (shouldDeleteOldImage && currentRecipe?.image_path && currentRecipe.image_path !== nextImagePath) {
        await deleteRecipeImage(currentRecipe.image_path);
      }

      showMessage('Recipe updated successfully.', 'success');
      window.location.replace(`recipe-details.html?id=${updatedRecipe.id}`);
    } catch (error) {
      if (uploadedImagePath) {
        try {
          await deleteRecipeImage(uploadedImagePath);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded image:', cleanupError);
        }
      }

      showMessage(error.message || 'Unable to update recipe.', 'danger');
    } finally {
      setSaving(false);
    }
  });
}

initializePage();
