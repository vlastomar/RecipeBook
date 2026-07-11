import { supabase } from './supabaseClient.js';
import { deleteRecipeImage } from './storageService.js';

const RECIPE_SELECT = `
  id,
  user_id,
  category_id,
  title,
  description,
  ingredients,
  instructions,
  preparation_minutes,
  servings,
  image_path,
  is_published,
  created_at,
  updated_at,
  categories:category_id (
    id,
    name,
    description
  ),
  profiles:user_id (
    id,
    display_name,
    bio,
    avatar_path
  )
`;

function normalizeRecipeRecord(record) {
  return {
    ...record,
    category: record.categories ?? null,
    owner: record.profiles ?? null,
  };
}

function normalizeCategoryError(error, fallbackMessage) {
  if (!error) {
    return new Error(fallbackMessage);
  }

  const message = error.message || fallbackMessage;

  if (error.code === '23505' || /duplicate key|already exists|unique/i.test(message)) {
    return new Error('A category with this name already exists.');
  }

  return new Error(`${fallbackMessage}: ${message}`);
}

function validateRole(role) {
  const normalizedRole = String(role ?? '').trim().toLowerCase();

  if (normalizedRole !== 'user' && normalizedRole !== 'admin') {
    throw new Error('Role must be either "user" or "admin".');
  }

  return normalizedRole;
}

function normalizeCategoryPayload(data) {
  const name = String(data?.name ?? '').trim();
  const description = String(data?.description ?? '').trim();

  if (!name) {
    throw new Error('Category name is required.');
  }

  return {
    name,
    description: description || null,
  };
}

export async function getAdminDashboardStats() {
  try {
    const [usersCount, recipesCount, publishedRecipesCount, categoriesCount] = await Promise.all([
      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('is_published', true),
      supabase
        .from('categories')
        .select('id', { count: 'exact', head: true }),
    ]);

    if (usersCount.error) {
      throw new Error(`Unable to load user count: ${usersCount.error.message}`);
    }
    if (recipesCount.error) {
      throw new Error(`Unable to load recipe count: ${recipesCount.error.message}`);
    }
    if (publishedRecipesCount.error) {
      throw new Error(`Unable to load published recipe count: ${publishedRecipesCount.error.message}`);
    }
    if (categoriesCount.error) {
      throw new Error(`Unable to load category count: ${categoriesCount.error.message}`);
    }

    return {
      totalUsers: usersCount.count ?? 0,
      totalRecipes: recipesCount.count ?? 0,
      publishedRecipes: publishedRecipesCount.count ?? 0,
      totalCategories: categoriesCount.count ?? 0,
    };
  } catch (error) {
    throw new Error(error.message || 'Unable to load admin dashboard stats.');
  }
}

export async function getAllUsersWithRoles() {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, bio, avatar_path, created_at')
      .order('created_at', { ascending: false });

    if (profilesError) {
      throw new Error(`Unable to load users: ${profilesError.message}`);
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) {
      throw new Error(`Unable to load user roles: ${rolesError.message}`);
    }

    const roleMap = new Map((roles || []).map((entry) => [entry.user_id, entry.role]));

    return (profiles || []).map((profile) => ({
      ...profile,
      role: roleMap.get(profile.id) || 'user',
    }));
  } catch (error) {
    throw new Error(error.message || 'Unable to load users.');
  }
}

export async function updateUserRole(userId, role) {
  try {
    const normalizedRole = validateRole(role);

    const { data, error } = await supabase
      .from('user_roles')
      .update({ role: normalizedRole })
      .eq('user_id', userId)
      .select('user_id, role')
      .single();

    if (error) {
      throw new Error(`Unable to update user role: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Unable to update user role.');
  }
}

export async function getAllRecipes() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load recipes: ${error.message}`);
    }

    return (data || []).map(normalizeRecipeRecord);
  } catch (error) {
    throw new Error(error.message || 'Unable to load recipes.');
  }
}

export async function adminDeleteRecipe(recipeId) {
  try {
    const { data: recipeData, error: fetchError } = await supabase
      .from('recipes')
      .select('image_path')
      .eq('id', recipeId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Unable to load recipe for deletion: ${fetchError.message}`);
    }

    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

    if (error) {
      throw new Error(`Unable to delete recipe: ${error.message}`);
    }

    let warning = null;

    if (recipeData?.image_path) {
      try {
        await deleteRecipeImage(recipeData.image_path);
      } catch (storageError) {
        warning = `Recipe deleted successfully, but the stored image could not be removed from storage: ${storageError.message}`;
      }
    }

    return { success: true, recipeId, warning };
  } catch (error) {
    throw new Error(error.message || 'Unable to delete recipe.');
  }
}

export async function getAllCategories() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw normalizeCategoryError(error, 'Unable to load categories.');
    }

    return data || [];
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to load categories.');
  }
}

export async function adminCreateCategory(data) {
  try {
    const payload = normalizeCategoryPayload(data);

    const { data: category, error } = await supabase
      .from('categories')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw normalizeCategoryError(error, 'Unable to create category.');
    }

    return category;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to create category.');
  }
}

export async function adminUpdateCategory(categoryId, data) {
  try {
    const payload = normalizeCategoryPayload(data);

    const { data: category, error } = await supabase
      .from('categories')
      .update(payload)
      .eq('id', categoryId)
      .select('*')
      .single();

    if (error) {
      throw normalizeCategoryError(error, 'Unable to update category.');
    }

    return category;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to update category.');
  }
}

export async function adminDeleteCategory(categoryId) {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);

    if (error) {
      throw normalizeCategoryError(error, 'Unable to delete category.');
    }

    return { success: true, categoryId };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to delete category.');
  }
}
