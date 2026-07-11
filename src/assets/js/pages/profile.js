import { requireAuth } from '../utils/authGuard.js';
import { getCurrentProfile, updateCurrentProfile } from '../services/profileService.js';
import {
  validateImageFile,
  uploadProfileImage,
  deleteProfileImage,
  getProfileImagePublicUrl,
} from '../services/storageService.js';

const form = document.getElementById('profileForm');
const loadingState = document.getElementById('loadingState');
const messageContainer = document.getElementById('messageContainer');
const saveButton = document.getElementById('saveButton');
const displayNameInput = document.getElementById('displayName');
const emailInput = document.getElementById('email');
const bioInput = document.getElementById('bio');
const avatarInput = document.getElementById('avatarInput');
const removeAvatarCheckbox = document.getElementById('removeAvatar');
const avatarPreview = document.getElementById('avatarPreview');
const avatarFallback = document.getElementById('avatarFallback');

let currentProfile = null;
let authUser = null;
let currentAvatarUrl = null;
let previewObjectUrl = null;

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

function setLoading(isLoading) {
  if (loadingState) {
    loadingState.hidden = !isLoading;
  }

  if (form) {
    form.classList.toggle('d-none', isLoading);
  }
}

function setSaving(isSaving) {
  if (!saveButton || !form) return;

  const controls = form.querySelectorAll('input, textarea, button');

  controls.forEach((control) => {
    if (control !== saveButton) {
      control.disabled = isSaving;
    }
  });

  saveButton.disabled = isSaving;
  saveButton.innerHTML = isSaving
    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`
    : 'Save Changes';
}

function revokePreviewUrl() {
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
}

function renderAvatar() {
  if (!avatarPreview || !avatarFallback) return;

  const effectiveUrl = previewObjectUrl || currentAvatarUrl || null;

  if (effectiveUrl) {
    avatarPreview.src = effectiveUrl;
    avatarPreview.classList.remove('d-none');
    avatarFallback.classList.add('d-none');
    return;
  }

  avatarPreview.removeAttribute('src');
  avatarPreview.classList.add('d-none');
  avatarFallback.classList.remove('d-none');
  avatarFallback.textContent = (displayNameInput?.value?.trim().charAt(0) || authUser?.email?.charAt(0) || 'U').toUpperCase();
}

function prefillForm(profile) {
  currentProfile = profile;

  if (!profile) {
    currentAvatarUrl = null;
    renderAvatar();
    return;
  }

  if (displayNameInput) {
    displayNameInput.value = profile.display_name || '';
  }

  if (bioInput) {
    bioInput.value = profile.bio || '';
  }

  if (emailInput && authUser?.email) {
    emailInput.value = authUser.email;
  }

  if (profile.avatar_path) {
    try {
      currentAvatarUrl = getProfileImagePublicUrl(profile.avatar_path);
    } catch (error) {
      console.error('Unable to resolve avatar URL:', error);
      currentAvatarUrl = null;
    }
  } else {
    currentAvatarUrl = null;
  }

  renderAvatar();
}

function handleAvatarSelection(event) {
  const selectedFile = event.target?.files?.[0] ?? null;

  revokePreviewUrl();
  clearMessage();

  if (!selectedFile) {
    renderAvatar();
    return;
  }

  const validation = validateImageFile(selectedFile);

  if (!validation.isValid) {
    showMessage(validation.error, 'warning');
    event.target.value = '';
    renderAvatar();
    return;
  }

  previewObjectUrl = URL.createObjectURL(selectedFile);
  renderAvatar();
}

async function initializePage() {
  authUser = await requireAuth();
  if (!authUser) return;

  setLoading(true);
  clearMessage();

  try {
    const profile = await getCurrentProfile();
    prefillForm(profile);
  } catch (error) {
    showMessage(error.message || 'Unable to load profile.', 'danger');
  } finally {
    setLoading(false);
  }
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearMessage();

    let uploadedAvatarPath = null;
    let shouldDeleteOldAvatar = false;
    let oldAvatarPath = currentProfile?.avatar_path ?? null;

    try {
      setSaving(true);

      const displayName = displayNameInput?.value.trim() || '';
      const bio = bioInput?.value.trim() || '';
      const selectedFile = avatarInput?.files?.[0] ?? null;
      const removeCurrentAvatar = removeAvatarCheckbox?.checked ?? false;

      if (!displayName) {
        throw new Error('Display name is required.');
      }

      let nextAvatarPath = currentProfile?.avatar_path ?? null;

      if (selectedFile) {
        const validation = validateImageFile(selectedFile);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const uploadResult = await uploadProfileImage(selectedFile);
        uploadedAvatarPath = uploadResult.filePath;
        nextAvatarPath = uploadedAvatarPath;
        shouldDeleteOldAvatar = Boolean(oldAvatarPath);
      } else if (removeCurrentAvatar) {
        nextAvatarPath = null;
        shouldDeleteOldAvatar = Boolean(oldAvatarPath);
      }

      const updatedProfile = await updateCurrentProfile({
        display_name: displayName,
        bio: bio || null,
        avatar_path: nextAvatarPath,
      });

      currentProfile = updatedProfile;
      currentAvatarUrl = updatedProfile.avatar_path
        ? getProfileImagePublicUrl(updatedProfile.avatar_path)
        : null;
      revokePreviewUrl();

      if (shouldDeleteOldAvatar && oldAvatarPath && oldAvatarPath !== nextAvatarPath) {
        await deleteProfileImage(oldAvatarPath);
      }

      if (avatarInput) {
        avatarInput.value = '';
      }
      if (removeAvatarCheckbox) {
        removeAvatarCheckbox.checked = false;
      }
      renderAvatar();
      showMessage('Profile updated successfully.', 'success');
    } catch (error) {
      if (uploadedAvatarPath) {
        try {
          await deleteProfileImage(uploadedAvatarPath);
        } catch (cleanupError) {
          console.error('Failed to clean up uploaded avatar:', cleanupError);
        }
      }

      showMessage(error.message || 'Unable to update profile.', 'danger');
    } finally {
      setSaving(false);
    }
  });
}

if (avatarInput) {
  avatarInput.addEventListener('change', handleAvatarSelection);
}

initializePage();
