import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/pages/index.html'),
        login: resolve(__dirname, 'src/pages/login.html'),
        register: resolve(__dirname, 'src/pages/register.html'),
        recipes: resolve(__dirname, 'src/pages/recipes.html'),
        recipeDetails: resolve(__dirname, 'src/pages/recipe-details.html'),
        addRecipe: resolve(__dirname, 'src/pages/add-recipe.html'),
        editRecipe: resolve(__dirname, 'src/pages/edit-recipe.html'),
        myRecipes: resolve(__dirname, 'src/pages/my-recipes.html'),
        profile: resolve(__dirname, 'src/pages/profile.html'),
        admin: resolve(__dirname, 'src/pages/admin.html')
      }
    }
  }
});
