import { supabase } from './supabaseClient.js';

export const RECIPE_IMAGES_BUCKET = 'recipe-images';
export const PROFILE_IMAGES_BUCKET = 'profile-images';
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getValidatedExtension(fileName, mimeType) {
  const name = (fileName || '').toLowerCase();
  const extensionMatch = name.match(/\.[a-z0-9]+$/i);

  if (extensionMatch) {
    return extensionMatch[0];
  }

  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    default:
      return '.jpg';
  }
}

function getSafeBaseName(fileName) {
  const baseName = (fileName || 'recipe-image')
    .replace(/\.[^/.]+$/, '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return baseName || 'recipe-image';
}

function createUniqueFileName(fileName, mimeType) {
  const safeBaseName = getSafeBaseName(fileName).slice(0, 80);
  const extension = getValidatedExtension(fileName, mimeType);
  const uniqueSuffix = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${safeBaseName}-${uniqueSuffix}${extension}`;
}

export function validateImageFile(file) {
  if (!file) {
    return {
      isValid: false,
      error: 'An image file is required.',
    };
  }

  if (!(file instanceof File)) {
    return {
      isValid: false,
      error: 'The selected item is not a valid file.',
    };
  }

  const mimeType = (file.type || '').toLowerCase();

  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
    return {
      isValid: false,
      error: 'Only JPEG, PNG, and WebP images are supported.',
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `Image size exceeds the 5 MB limit. Received ${formatBytes(file.size)}.`,
    };
  }

  return {
    isValid: true,
    file,
    mimeType,
    sizeBytes: file.size,
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  };
}

async function uploadImageToBucket(file, bucketName, errorPrefix) {
  const validation = validateImageFile(file);

  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to determine current user: ${userError.message}`);
  }

  if (!userData?.user) {
    throw new Error(`Authentication required to upload ${errorPrefix.toLowerCase()} images.`);
  }

  const uniqueFileName = createUniqueFileName(file.name, validation.mimeType);
  const filePath = `${userData.user.id}/${uniqueFileName}`;

  const { data, error } = await supabase.storage.from(bucketName).upload(filePath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: validation.mimeType,
  });

  if (error) {
    throw new Error(`Unable to upload image: ${error.message}`);
  }

  return {
    filePath: data?.path || filePath,
    publicUrl: getPublicUrlForBucket(bucketName, data?.path || filePath),
  };
}

async function deleteImageFromBucket(filePath, bucketName) {
  if (!filePath) {
    throw new Error('A stored image path is required.');
  }

  const { error } = await supabase.storage.from(bucketName).remove([filePath]);

  if (error) {
    throw new Error(`Unable to delete image: ${error.message}`);
  }

  return { success: true, filePath };
}

function getPublicUrlForBucket(bucketName, filePath) {
  if (!filePath) {
    throw new Error('A stored image path is required.');
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);

  return data?.publicUrl || null;
}

export async function uploadRecipeImage(file) {
  return uploadImageToBucket(file, RECIPE_IMAGES_BUCKET, 'recipe');
}

export async function deleteRecipeImage(filePath) {
  return deleteImageFromBucket(filePath, RECIPE_IMAGES_BUCKET);
}

export function getRecipeImagePublicUrl(filePath) {
  return getPublicUrlForBucket(RECIPE_IMAGES_BUCKET, filePath);
}

export async function uploadProfileImage(file) {
  return uploadImageToBucket(file, PROFILE_IMAGES_BUCKET, 'profile');
}

export async function deleteProfileImage(filePath) {
  return deleteImageFromBucket(filePath, PROFILE_IMAGES_BUCKET);
}

export function getProfileImagePublicUrl(filePath) {
  return getPublicUrlForBucket(PROFILE_IMAGES_BUCKET, filePath);
}
