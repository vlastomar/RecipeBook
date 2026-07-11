import { requireAuth } from '../utils/authGuard.js';
import { createRecipe } from '../services/recipeService.js';
import { getCategories } from '../services/categoryService.js';

const form = document.getElementById('recipeForm');
const messageContainer = document.getElementById('messageContainer');
const saveButton = document.getElementById('saveButton');
const categorySelect = document.getElementById('category');

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${message}
    </div>
  `;
}

function setSaving(isSaving) {
  if (!saveButton) return;

  saveButton.disabled = isSaving;
  saveButton.textContent = isSaving ? 'Saving...' : 'Save Recipe';
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

async function initializePage() {
  const user = await requireAuth();
  if (!user) return;

  await populateCategories();
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    showMessage('');

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

      const payload = {
        title,
        description: description || null,
        ingredients,
        instructions,
        category_id: categorySelect?.value ? Number(categorySelect.value) : null,
        preparation_minutes: preparationMinutes ? Number(preparationMinutes) : null,
        servings: servings ? Number(servings) : null,
        is_published: published,
      };

      await createRecipe(payload);
      showMessage('Recipe created successfully.', 'success');
      window.location.replace('my-recipes.html');
    } catch (error) {
      showMessage(error.message || 'Unable to save recipe.', 'danger');
    } finally {
      setSaving(false);
    }
  });
}

initializePage();
