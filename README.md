# RecipeBook

RecipeBook is a multi-page recipe management web application where users can register, log in, create recipes, edit their own content, upload profile and recipe images, and browse published recipes. Administrators can manage all recipes and categories.

## Project Description

The application is designed for two main roles:

- Users can create, update, and delete their own recipes.
- Users can edit their profile information and upload an avatar.
- Everyone can browse published recipes.
- Administrators can access the admin panel and manage recipes and categories.

RecipeBook uses a simple multi-page structure instead of a SPA, which keeps the codebase easy to understand and maintain.

## Architecture

### Front End

- HTML pages in `src/pages/`
- Reusable JavaScript modules in `src/assets/js/`
- Shared styling in `src/assets/css/`
- Bootstrap 5 for layout, forms, cards, modals, and alerts
- Vite for development and production builds

### Back End

- Supabase Authentication for sign-up, login, logout, and session handling
- Supabase Database for profiles, categories, recipes, and roles
- Supabase Storage for recipe images and profile avatars
- Row Level Security (RLS) for access control

### Technologies Used

- HTML
- CSS
- JavaScript ES Modules
- Bootstrap 5
- Node.js
- npm
- Vite
- Supabase

## Database Schema Design

Main tables and relationships:

```mermaid
erDiagram
	PROFILES ||--|| USER_ROLES : has
	PROFILES ||--o{ RECIPES : owns
	CATEGORIES ||--o{ RECIPES : groups

	PROFILES {
		uuid id PK
		text display_name
		text bio
		text avatar_path
		timestamptz created_at
		timestamptz updated_at
	}

	USER_ROLES {
		uuid user_id PK
		text role
		timestamptz created_at
	}

	CATEGORIES {
		bigint id PK
		text name
		text description
		timestamptz created_at
		timestamptz updated_at
	}

	RECIPES {
		uuid id PK
		uuid user_id FK
		bigint category_id FK
		text title
		text description
		text ingredients
		text instructions
		integer preparation_minutes
		integer servings
		text image_path
		boolean is_published
		timestamptz created_at
		timestamptz updated_at
	}
```

### Schema Notes

- `profiles` stores public user profile data and avatar paths.
- `user_roles` stores whether a user is `user` or `admin`.
- `categories` stores recipe categories.
- `recipes` stores the main recipe content and links to both `profiles` and `categories`.

## Local Development Setup

### Prerequisites

- Node.js installed
- npm installed
- A Supabase project

### Environment Variables

Create a Vite environment file with the following values:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Install and Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview the Production Build

```bash
npm run preview
```

## Key Folders and Files

### Root Files

- `index.html` - entry point that redirects or boots the app shell
- `package.json` - scripts and dependencies
- `vite.config.js` - Vite multi-page build configuration
- `README.md` - project documentation

### `src/pages/`

Contains the HTML pages for each route:

- `index.html` - home page
- `login.html` - login page
- `register.html` - registration page
- `recipes.html` - published recipes list
- `recipe-details.html` - single recipe view
- `add-recipe.html` - create recipe page
- `edit-recipe.html` - edit recipe page
- `my-recipes.html` - user-owned recipes page
- `profile.html` - profile management page
- `admin.html` - admin dashboard

### `src/assets/js/components/`

Shared UI components such as:

- navbar rendering
- footer rendering
- alert helpers

### `src/assets/js/pages/`

Page-specific logic for authentication, recipes, profile management, and admin actions.

### `src/assets/js/services/`

Business logic and API wrappers for:

- Supabase client setup
- authentication
- profile operations
- recipe operations
- category operations
- storage uploads and deletions

### `src/assets/js/utils/`

Reusable utility functions such as:

- auth guards
- validation helpers
- formatting helpers

### `src/assets/css/`

Shared styling for the entire application.

### `supabase/`

Contains local Supabase configuration and SQL migrations for schema, RLS, and storage policies.

## Notes

- The app expects authenticated users for create, edit, and profile actions.
- Image uploads are stored in Supabase Storage with RLS policies that restrict access by user ownership.
- Admin functionality depends on the `user_roles` table and the `public.is_admin()` helper.
