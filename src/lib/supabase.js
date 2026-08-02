import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.PUBLIC_SUPABASE_URL || "")
  .replace(/\/+$/, "")
  .replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const isBrowser = typeof window !== "undefined";
const REMEMBER_ME_KEY = "bean-scene-remember-me";
const STORAGE_KEY = "bean-scene-auth-token";

const resolveAuthStorage = () => {
  if (!isBrowser) return undefined;

  const rememberMe = window.localStorage.getItem(REMEMBER_ME_KEY) === "true";
  return rememberMe ? window.localStorage : window.sessionStorage;
};

const createBrowserSupabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: STORAGE_KEY,
      storage: resolveAuthStorage(),
    },
  });

export const setRememberMePreference = (rememberMe) => {
  if (!isBrowser) return;

  if (rememberMe) {
    window.localStorage.setItem(REMEMBER_ME_KEY, "true");
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.removeItem(REMEMBER_ME_KEY);
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getSupabaseClientForCurrentPreference = () =>
  createBrowserSupabaseClient();

export const supabase = createBrowserSupabaseClient();
