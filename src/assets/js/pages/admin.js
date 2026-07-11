import { requireAdmin } from '../utils/authGuard.js';
import {
  getAdminDashboardStats,
  getAllRecipes,
  adminDeleteRecipe,
  getAllCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  getAllUsersWithRoles,
  updateUserRole,
} from '../services/adminService.js';
import { Modal } from 'bootstrap';

const dashboardSection = document.getElementById('dashboardSection');
const recipesSection = document.getElementById('recipesSection');
const categoriesSection = document.getElementById('categoriesSection');
const usersSection = document.getElementById('usersSection');
const messageContainer = document.getElementById('messageContainer');
const dashboardLoading = document.getElementById('dashboardLoading');
const recipesLoading = document.getElementById('recipesLoading');
const categoriesLoading = document.getElementById('categoriesLoading');
const usersLoading = document.getElementById('usersLoading');
const recipesTableBody = document.getElementById('recipesTableBody');
const categoriesTableBody = document.getElementById('categoriesTableBody');
const usersTableBody = document.getElementById('usersTableBody');
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryName');
const categoryDescriptionInput = document.getElementById('categoryDescription');
const categoryModalElement = document.getElementById('categoryModal');
const categoryModalTitle = document.getElementById('categoryModalTitle');
const categoryModalSubmit = document.getElementById('categoryModalSubmit');
const recipeDeleteModalElement = document.getElementById('recipeDeleteModal');
const recipeDeleteModalBody = document.getElementById('recipeDeleteModalBody');
const confirmRecipeDeleteButton = document.getElementById('confirmRecipeDeleteButton');
const categoryDeleteModalElement = document.getElementById('categoryDeleteModal');
const categoryDeleteModalBody = document.getElementById('categoryDeleteModalBody');
const confirmCategoryDeleteButton = document.getElementById('confirmCategoryDeleteButton');
const roleChangeModalElement = document.getElementById('roleChangeModal');
const roleChangeModalBody = document.getElementById('roleChangeModalBody');
const confirmRoleChangeButton = document.getElementById('confirmRoleChangeButton');
const roleSelect = document.getElementById('roleSelect');

let currentUserId = null;
let currentCategoryId = null;
let currentRecipeId = null;
let currentUserRoleChange = null;
let recipeDeleteModal = null;
let categoryDeleteModal = null;
let roleChangeModal = null;
let categoryModal = null;
let dashboardStats = null;
let recipes = [];
let categories = [];
let users = [];

function showMessage(message, type = 'danger') {
  if (!messageContainer) return;

  messageContainer.innerHTML = `
    <div class="alert alert-${type}" role="alert">
      ${message}
    </div>
  `;
}

function clearMessage() {
  if (messageContainer) {
    messageContainer.innerHTML = '';
  }
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Date(value).toLocaleDateString();
}

function setLoading(element, isLoading) {
  if (element) {
    element.hidden = !isLoading;
  }
}

function renderDashboardStats(stats) {
  dashboardStats = stats;

  const statCards = [
    ['Total Recipes', stats.totalRecipes, 'bi-journal-richtext'],
    ['Published Recipes', stats.publishedRecipes, 'bi-check-circle'],
    ['Total Categories', stats.totalCategories, 'bi-tags'],
    ['Total Profiles', stats.totalUsers, 'bi-people'],
  ];

  const container = document.getElementById('dashboardStats');
  if (!container) return;

  container.innerHTML = statCards.map(([label, value, icon]) => `
    <div class="col-12 col-md-6 col-lg-3">
      <div class="card shadow-sm h-100">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <p class="text-muted small mb-1">${label}</p>
              <h3 class="mb-0">${value}</h3>
            </div>
            <i class="bi ${icon} fs-3 text-primary"></i>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderRecipes() {
  if (!recipesTableBody) return;

  if (!recipes.length) {
    recipesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-muted py-4">No recipes found.</td>
      </tr>
    `;
    return;
  }

  recipesTableBody.innerHTML = recipes.map((recipe) => {
    const ownerName = recipe.owner?.display_name || 'Unknown';
    const status = recipe.is_published ? 'Published' : 'Draft';
    const statusClass = recipe.is_published ? 'bg-success' : 'bg-secondary';
    const title = recipe.title || 'Untitled recipe';

    return `
      <tr>
        <td>${title}</td>
        <td>${ownerName}</td>
        <td><span class="badge ${statusClass}">${status}</span></td>
        <td>${formatDate(recipe.created_at)}</td>
        <td><a class="btn btn-outline-primary btn-sm" href="recipe-details.html?id=${recipe.id}">View</a></td>
        <td>
          <button class="btn btn-outline-danger btn-sm" data-action="delete-recipe" data-recipe-id="${recipe.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCategories() {
  if (!categoriesTableBody) return;

  if (!categories.length) {
    categoriesTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No categories found.</td>
      </tr>
    `;
    return;
  }

  categoriesTableBody.innerHTML = categories.map((category) => `
    <tr>
      <td>${category.name}</td>
      <td>${category.description || '—'}</td>
      <td>${formatDate(category.created_at)}</td>
      <td>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-outline-secondary btn-sm" data-action="edit-category" data-category-id="${category.id}">Edit</button>
          <button class="btn btn-outline-danger btn-sm" data-action="delete-category" data-category-id="${category.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderUsers() {
  if (!usersTableBody) return;

  if (!users.length) {
    usersTableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-muted py-4">No profiles found.</td>
      </tr>
    `;
    return;
  }

  usersTableBody.innerHTML = users.map((user) => `
    <tr>
      <td>${user.display_name || 'Unnamed profile'}</td>
      <td>${user.role || 'user'}</td>
      <td>${formatDate(user.created_at)}</td>
      <td>
        <button class="btn btn-outline-primary btn-sm" data-action="change-role" data-user-id="${user.id}" data-user-role="${user.role || 'user'}">Change Role</button>
      </td>
    </tr>
  `).join('');
}

async function loadDashboardStats() {
  setLoading(dashboardLoading, true);
  try {
    const stats = await getAdminDashboardStats();
    renderDashboardStats(stats);
  } catch (error) {
    showMessage(error.message || 'Unable to load dashboard stats.', 'danger');
  } finally {
    setLoading(dashboardLoading, false);
  }
}

async function loadRecipes() {
  setLoading(recipesLoading, true);
  try {
    recipes = await getAllRecipes();
    renderRecipes();
  } catch (error) {
    showMessage(error.message || 'Unable to load recipes.', 'danger');
  } finally {
    setLoading(recipesLoading, false);
  }
}

async function loadCategories() {
  setLoading(categoriesLoading, true);
  try {
    categories = await getAllCategories();
    renderCategories();
  } catch (error) {
    showMessage(error.message || 'Unable to load categories.', 'danger');
  } finally {
    setLoading(categoriesLoading, false);
  }
}

async function loadUsers() {
  setLoading(usersLoading, true);
  try {
    users = await getAllUsersWithRoles();
    renderUsers();
  } catch (error) {
    showMessage(error.message || 'Unable to load users.', 'danger');
  } finally {
    setLoading(usersLoading, false);
  }
}

async function initializePage() {
  const user = await requireAdmin();
  if (!user) return;

  currentUserId = user.id;
  await Promise.all([loadDashboardStats(), loadRecipes(), loadCategories(), loadUsers()]);
}

function resetCategoryForm() {
  if (categoryForm) {
    categoryForm.reset();
  }
  currentCategoryId = null;
  categoryModalTitle.textContent = 'Create Category';
  categoryModalSubmit.textContent = 'Create';
}

async function handleCategorySubmit(event) {
  event.preventDefault();
  clearMessage();

  try {
    const name = categoryNameInput?.value.trim() || '';
    const description = categoryDescriptionInput?.value.trim() || '';

    if (!name) {
      throw new Error('Category name is required.');
    }

    if (currentCategoryId) {
      await adminUpdateCategory(currentCategoryId, { name, description });
      showMessage('Category updated successfully.', 'success');
    } else {
      await adminCreateCategory({ name, description });
      showMessage('Category created successfully.', 'success');
    }

    resetCategoryForm();
    if (categoryModal) {
      categoryModal.hide();
    }
    await loadCategories();
  } catch (error) {
    showMessage(error.message || 'Unable to save category.', 'danger');
  }
}

async function handleDeleteRecipeConfirmed() {
  if (!currentRecipeId) return;

  try {
    const result = await adminDeleteRecipe(currentRecipeId);
    currentRecipeId = null;
    if (recipeDeleteModal) {
      recipeDeleteModal.hide();
    }
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

async function handleDeleteCategoryConfirmed() {
  if (!currentCategoryId) return;

  try {
    await adminDeleteCategory(currentCategoryId);
    currentCategoryId = null;
    if (categoryDeleteModal) {
      categoryDeleteModal.hide();
    }
    await loadCategories();
    showMessage('Category deleted successfully.', 'success');
  } catch (error) {
    showMessage(error.message || 'Unable to delete category.', 'danger');
  }
}

async function handleRoleChangeConfirmed() {
  if (!currentUserRoleChange || !roleSelect) return;

  const nextRole = roleSelect.value;

  if (currentUserRoleChange.userId === currentUserId && nextRole === 'user') {
    showMessage('You cannot remove your own admin role.', 'warning');
    return;
  }

  try {
    await updateUserRole(currentUserRoleChange.userId, nextRole);
    if (roleChangeModal) {
      roleChangeModal.hide();
    }
    await loadUsers();
    showMessage('User role updated successfully.', 'success');
  } catch (error) {
    showMessage(error.message || 'Unable to update user role.', 'danger');
  }
}

if (categoryForm) {
  categoryForm.addEventListener('submit', handleCategorySubmit);
}

if (confirmRecipeDeleteButton) {
  confirmRecipeDeleteButton.addEventListener('click', handleDeleteRecipeConfirmed);
}

if (confirmCategoryDeleteButton) {
  confirmCategoryDeleteButton.addEventListener('click', handleDeleteCategoryConfirmed);
}

if (confirmRoleChangeButton) {
  confirmRoleChangeButton.addEventListener('click', handleRoleChangeConfirmed);
}

if (categoryModalElement) {
  categoryModal = new Modal(categoryModalElement);
}

if (recipeDeleteModalElement) {
  recipeDeleteModal = new Modal(recipeDeleteModalElement);
}

if (categoryDeleteModalElement) {
  categoryDeleteModal = new Modal(categoryDeleteModalElement);
}

if (roleChangeModalElement) {
  roleChangeModal = new Modal(roleChangeModalElement);
}

document.addEventListener('click', (event) => {
  const recipeDeleteButton = event.target.closest('[data-action="delete-recipe"]');
  if (recipeDeleteButton) {
    currentRecipeId = recipeDeleteButton.getAttribute('data-recipe-id');
    if (recipeDeleteModalBody) {
      recipeDeleteModalBody.textContent = `Delete this recipe?`;
    }
    recipeDeleteModal?.show();
    return;
  }

  const editCategoryButton = event.target.closest('[data-action="edit-category"]');
  if (editCategoryButton) {
    currentCategoryId = editCategoryButton.getAttribute('data-category-id');
    const category = categories.find((entry) => String(entry.id) === String(currentCategoryId));
    if (category) {
      categoryNameInput.value = category.name || '';
      categoryDescriptionInput.value = category.description || '';
      categoryModalTitle.textContent = 'Edit Category';
      categoryModalSubmit.textContent = 'Save';
      categoryModal?.show();
    }
    return;
  }

  const deleteCategoryButton = event.target.closest('[data-action="delete-category"]');
  if (deleteCategoryButton) {
    currentCategoryId = deleteCategoryButton.getAttribute('data-category-id');
    const category = categories.find((entry) => String(entry.id) === String(currentCategoryId));
    if (categoryDeleteModalBody) {
      categoryDeleteModalBody.textContent = `Delete category "${category?.name || 'this category'}"?`;
    }
    categoryDeleteModal?.show();
    return;
  }

  const changeRoleButton = event.target.closest('[data-action="change-role"]');
  if (changeRoleButton) {
    currentUserRoleChange = {
      userId: changeRoleButton.getAttribute('data-user-id'),
      role: changeRoleButton.getAttribute('data-user-role') || 'user',
    };
    const targetUser = users.find((entry) => String(entry.id) === String(currentUserRoleChange.userId));
    if (roleChangeModalBody) {
      roleChangeModalBody.textContent = `Change role for ${targetUser?.display_name || 'this user'}?`;
    }
    if (roleSelect) {
      roleSelect.value = currentUserRoleChange.role || 'user';
    }
    roleChangeModal?.show();
    return;
  }
});

document.getElementById('createCategoryButton')?.addEventListener('click', () => {
  resetCategoryForm();
  categoryModal?.show();
});

if (document.getElementById('cancelCategoryButton')) {
  document.getElementById('cancelCategoryButton').addEventListener('click', () => {
    resetCategoryForm();
    categoryModal?.hide();
  });
}

initializePage();
