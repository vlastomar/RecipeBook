import { supabase } from './supabaseClient.js';

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

function buildRecipeQuery(options = {}) {
  const { search = '', category = '', sort = 'newest' } = options;
  let query = supabase.from('recipes').select(RECIPE_SELECT);

  query = query.eq('is_published', true);

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  return query;
}

export async function getPublishedRecipes(options = {}) {
  try {
    const { data, error } = await buildRecipeQuery(options);

    if (error) {
      throw new Error(`Unable to load published recipes: ${error.message}`);
    }

    return (data || []).map(normalizeRecipeRecord);
  } catch (error) {
    throw new Error(error.message || 'Unable to load published recipes.');
  }
}

export async function getRecipeById(recipeId) {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .eq('id', recipeId)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load recipe: ${error.message}`);
    }

    return data ? normalizeRecipeRecord(data) : null;
  } catch (error) {
    throw new Error(error.message || 'Unable to load recipe.');
  }
}

export async function getCurrentUserRecipes() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Unable to determine current user: ${userError.message}`);
    }

    if (!userData?.user) {
      return [];
    }

    const { data, error } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load your recipes: ${error.message}`);
    }

    return (data || []).map(normalizeRecipeRecord);
  } catch (error) {
    throw new Error(error.message || 'Unable to load your recipes.');
  }
}

export async function createRecipe(recipeData) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Unable to determine current user: ${userError.message}`);
    }

    if (!userData?.user) {
      throw new Error('Authentication required to create recipes.');
    }

    const safeRecipeData = {
      user_id: userData.user.id,
      title: recipeData.title,
      description: recipeData.description ?? null,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      category_id: recipeData.category_id ?? null,
      preparation_minutes: recipeData.preparation_minutes ?? null,
      servings: recipeData.servings ?? null,
      image_path: recipeData.image_path ?? null,
      is_published: recipeData.is_published ?? true,
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert(safeRecipeData)
      .select(RECIPE_SELECT)
      .single();

    if (error) {
      throw new Error(`Unable to create recipe: ${error.message}`);
    }

    return data ? normalizeRecipeRecord(data) : null;
  } catch (error) {
    throw new Error(error.message || 'Unable to create recipe.');
  }
}

export async function updateRecipe(recipeId, recipeData) {
  try {
    const safeRecipeData = {
      title: recipeData.title,
      description: recipeData.description ?? null,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      category_id: recipeData.category_id ?? null,
      preparation_minutes: recipeData.preparation_minutes ?? null,
      servings: recipeData.servings ?? null,
      image_path: recipeData.image_path ?? null,
      is_published: recipeData.is_published,
    };

    const { data, error } = await supabase
      .from('recipes')
      .update(safeRecipeData)
      .eq('id', recipeId)
      .select(RECIPE_SELECT)
      .single();

    if (error) {
      throw new Error(`Unable to update recipe: ${error.message}`);
    }

    return data ? normalizeRecipeRecord(data) : null;
  } catch (error) {
    throw new Error(error.message || 'Unable to update recipe.');
  }
}

export async function deleteRecipe(recipeId) {
  try {
    const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

    if (error) {
      throw new Error(`Unable to delete recipe: ${error.message}`);
    }

    return { success: true, recipeId };
  } catch (error) {
    throw new Error(error.message || 'Unable to delete recipe.');
  }
}

export async function getAllRecipesForAdmin() {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(RECIPE_SELECT)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to load recipes for admin: ${error.message}`);
    }

    return (data || []).map(normalizeRecipeRecord);
  } catch (error) {
    throw new Error(error.message || 'Unable to load recipes for admin.');
  }
}
