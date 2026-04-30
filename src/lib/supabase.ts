import { createClient } from "@supabase/supabase-js";

export const ACCESS_TOKEN_COOKIE = "wtw-access-token";
export const REFRESH_TOKEN_COOKIE = "wtw-refresh-token";

function readEnv(name: string) {
  const value = import.meta.env[name];

  return typeof value === "string" ? value.trim() : "";
}

export function getSupabaseEnv() {
  const url =
    readEnv("SUPABASE_URL") || readEnv("PUBLIC_SUPABASE_URL");
  const anonKey =
    readEnv("SUPABASE_ANON_KEY") ||
    readEnv("PUBLIC_SUPABASE_ANON_KEY") ||
    readEnv("SUPABASE_KEY") ||
    readEnv("PUBLIC_SUPABASE_KEY");

  if (!url || !anonKey) {
    throw new Error(
      "Faltan SUPABASE_URL y/o una key publica de Supabase en las variables de entorno",
    );
  }

  return { url, anonKey };
}

export function createSupabaseServerClient(accessToken?: string) {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
