import type { APIRoute } from "astro";
import { getSupabaseEnv } from "../../../lib/supabase";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const { url, anonKey } = getSupabaseEnv();

    return Response.json(
      { url, anonKey },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("Error en /api/auth/config:", error);

    return Response.json(
      { error: "Configuracion de Supabase incompleta" },
      { status: 500 },
    );
  }
};
