import { supabase } from './supabaseClient.js';

export async function registerUser(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
    },
  });

  if (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }

  return {
    user: data.user,
    session: data.session,
    needsEmailConfirmation: !data.session,
  };
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(`Login failed: ${error.message}`);
  }

  return {
    user: data.user,
    session: data.session,
  };
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Logout failed: ${error.message}`);
  }

  return { success: true };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(`Unable to load current user: ${error.message}`);
  }

  return {
    user: data.user,
  };
}

export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Unable to load current session: ${error.message}`);
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export async function getCurrentUserRole() {
  const { user } = await getCurrentUser();

  if (!user) {
    return { role: null, user: null };
  }

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load current user role: ${error.message}`);
  }

  return {
    role: data?.role ?? null,
    user,
  };
}

export function onAuthStateChange(callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('onAuthStateChange callback must be a function');
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

export async function signInWithEmail(email, password) {
  return loginUser(email, password);
}

export async function signUpWithEmail(email, password) {
  return registerUser(email, password);
}

export async function signOut() {
  return logoutUser();
}
