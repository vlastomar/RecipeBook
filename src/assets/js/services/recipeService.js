export async function getRecipes() {
  return [];
}

export async function addRecipe(recipe) {
  return recipe;
}

export async function updateRecipe(id, recipe) {
  return { id, ...recipe };
}
