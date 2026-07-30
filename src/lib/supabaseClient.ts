import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: new Error("Supabase is not configured") }),
        signInAnonymously: async () => ({ data: null, error: new Error("Supabase is not configured") }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: new Error("Supabase is not configured") }),
      },
    } as unknown as SupabaseClient);
