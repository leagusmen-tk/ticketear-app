import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anon) {
  throw new Error("Faltan las variables de entorno VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env");
}

// Singleton para Vite HMR (evita múltiples instancias en dev)
const globalForSupabase = globalThis as unknown as {
  __supabase?: SupabaseClient;
};

export const supabase =
  globalForSupabase.__supabase ??
  createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "ticketear-auth", // evita conflictos de storage si hubiera otra instancia
    },
  });

if (import.meta.env.DEV) {
  globalForSupabase.__supabase = supabase;
}
