import { supabase } from './supabaseClient.js';

function validateCategoryName(name) {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    throw new Error('Category name is required.');
  }

  return trimmedName;
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

export async function getCategories() {
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

export async function createCategory(name, description = null) {
  try {
    const trimmedName = validateCategoryName(name);
    const cleanDescription = description?.trim() ? description.trim() : null;

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: trimmedName,
        description: cleanDescription,
      })
      .select('*')
      .single();

    if (error) {
      throw normalizeCategoryError(error, 'Unable to create category.');
    }

    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to create category.');
  }
}

export async function updateCategory(categoryId, name, description = null) {
  try {
    const trimmedName = validateCategoryName(name);
    const cleanDescription = description?.trim() ? description.trim() : null;

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: trimmedName,
        description: cleanDescription,
      })
      .eq('id', categoryId)
      .select('*')
      .single();

    if (error) {
      throw normalizeCategoryError(error, 'Unable to update category.');
    }

    return data;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to update category.');
  }
}

export async function deleteCategory(categoryId) {
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
