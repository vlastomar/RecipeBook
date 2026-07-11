import { supabase } from './supabaseClient.js';

export async function getCurrentProfile() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Unable to determine current user: ${userError.message}`);
    }

    if (!userData?.user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, bio, avatar_path')
      .eq('id', userData.user.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load profile: ${error.message}`);
    }

    return data ?? null;
  } catch (error) {
    throw new Error(error.message || 'Unable to load profile.');
  }
}

export async function updateCurrentProfile(profileData) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw new Error(`Unable to determine current user: ${userError.message}`);
    }

    if (!userData?.user) {
      throw new Error('Authentication required to update profile.');
    }

    const displayName = (profileData?.display_name ?? '').toString().trim();
    if (!displayName) {
      throw new Error('Display name is required.');
    }

    const safeProfileData = {
      display_name: displayName,
      bio: profileData?.bio ?? null,
      avatar_path: profileData?.avatar_path ?? null,
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(safeProfileData)
      .eq('id', userData.user.id)
      .select('id, display_name, bio, avatar_path')
      .single();

    if (error) {
      throw new Error(`Unable to update profile: ${error.message}`);
    }

    return data;
  } catch (error) {
    throw new Error(error.message || 'Unable to update profile.');
  }
}
