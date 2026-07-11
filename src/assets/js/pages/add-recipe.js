import { requireAuth } from '../utils/authGuard.js';
import { createRecipe } from '../services/recipeService.js';
import { getCategories } from '../services/categoryService.js';
import { validateImageFile, uploadRecipeImage, deleteRecipeImage } from '../services/storageService.js';
import { validateRequiredText, validatePositiveInteger } from '../utils/validators.js';
import { showErrorAlert, showWarningAlert, clearAlert } from '../components/alerts.js';

const form = document.getElementById('recipeForm');
const messageContainer = document.getElementById('messageContainer');
const saveButton = document.getElementById('saveButton');
const categorySelect = document.getElementById('category');
const recipeImageInput = document.getElementById('recipeImage');
const imagePreview = document.getElementById('imagePreview');

let previewObjectUrl = null;

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  if (!message) {
    clearAlert(messageContainer);
    return;
  }

  if (type === 'warning') {
    showWarningAlert(messageContainer, message);
    return;
  }

  showErrorAlert(messageContainer, message);
}

function clearImagePreview() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  if (imagePreview) {
    imagePreview.src = '';
    imagePreview.classList.add('d-none');
  }
}

function setProcessing(isProcessing, label = 'Saving') {
  if (!saveButton || !form) return;

  const controls = form.querySelectorAll('input, select, textarea, button');

  controls.forEach((control) => {
    if (control !== saveButton) {
      control.disabled = isProcessing;
    }
  });

  saveButton.disabled = isProcessing;
  saveButton.innerHTML = isProcessing
    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${label}...`
    : 'Save Recipe';
}

function validateForm() {
  const titleValidation = validateRequiredText(document.getElementById('title')?.value, 'Title');
  const categoryValidation = validateRequiredText(categorySelect?.value, 'Category');
  const ingredientsValidation = validateRequiredText(document.getElementById('ingredients')?.value, 'Ingredients');
  const instructionsValidation = validateRequiredText(document.getElementById('instructions')?.value, 'Instructions');
  const preparationMinutes = document.getElementById('preparationMinutes')?.value;
  const servings = document.getElementById('servings')?.value;

  if (!titleValidation.isValid) throw new Error(titleValidation.error);
  if (!categoryValidation.isValid) throw new Error(categoryValidation.error);
  if (!ingredientsValidation.isValid) throw new Error(ingredientsValidation.error);
  if (!instructionsValidation.isValid) throw new Error(instructionsValidation.error);

  if (preparationMinutes !== '' && preparationMinutes !== null) {
    const preparationValidation = validatePositiveInteger(preparationMinutes, 'Preparation minutes');
    if (!preparationValidation.isValid) {
      throw new Error(preparationValidation.error);
    }
  }

  if (servings !== '' && servings !== null) {
    const servingsValidation = validatePositiveInteger(servings, 'Servings');
    if (!servingsValidation.isValid) {
      throw new Error(servingsValidation.error);
    }
  }
}

function handleImageSelection(event) {
  const selectedFile = event.target?.files?.[0] ?? null;

  clearImagePreview();
  showMessage('');

  if (!selectedFile) {
    return;
  }

  const validation = validateImageFile(selectedFile);

  if (!validation.isValid) {
    showMessage(validation.error, 'warning');
    event.target.value = '';
    return;
  }

  previewObjectUrl = URL.createObjectURL(selectedFile);
  if (imagePreview) {
    imagePreview.src = previewObjectUrl;
    imagePreview.classList.remove('d-none');
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

async function initializePage() {
  const user = await requireAuth();
  if (!user) return;

  await populateCategories();

  if (recipeImageInput) {
    recipeImageInput.addEventListener('change', handleImageSelection);
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

    let uploadedImagePath = null;
    let recipeCreated = false;

    try {
      validateForm();
      setProcessing(true, 'Uploading image');

      const selectedFile = recipeImageInput?.files?.[0] ?? null;

      if (selectedFile) {
        const validation = validateImageFile(selectedFile);

        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const uploadResult = await uploadRecipeImage(selectedFile);
        uploadedImagePath = uploadResult.filePath;
      }

      setProcessing(true, 'Creating recipe');

      const title = document.getElementById('title').value.trim();
      const description = document.getElementById('description').value.trim();
      const ingredients = document.getElementById('ingredients').value.trim();
      const instructions = document.getElementById('instructions').value.trim();
      const preparationMinutes = document.getElementById('preparationMinutes').value;
      const servings = document.getElementById('servings').value;
      const published = document.getElementById('published').checked;

      const payload = {
        title,
        description: description || null,
        ingredients,
        instructions,
        category_id: categorySelect?.value ? Number(categorySelect.value) : null,
        preparation_minutes: preparationMinutes ? Number(preparationMinutes) : null,
        servings: servings ? Number(servings) : null,
        image_path: uploadedImagePath ?? null,
        is_published: published,
      };

      await createRecipe(payload);
      recipeCreated = true;
      showMessage('Recipe created successfully.', 'success');
      window.location.replace('my-recipes.html');
    } catch (error) {
      if (uploadedImagePath && !recipeCreated) {
        try {
          await deleteRecipeImage(uploadedImagePath);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded image:', cleanupError);
        }
      }

      showMessage(error.message || 'Unable to save recipe.', 'danger');
    } finally {
      setProcessing(false);
    }
  });
}

initializePage();
