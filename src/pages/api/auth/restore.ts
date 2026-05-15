import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../lib/supabase";
import { buildUserPayload, setAuthCookies } from "../../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json().catch(() => null);
    const session = body?.session;

    if (!session?.access_token || !session?.refresh_token) {
      return Response.json(
        { error: "Sesión OAuth inválida" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient(session.access_token);
    const { data, error } = await supabase.auth.getUser(session.access_token);

    if (error || !data.user) {
      return Response.json(
        { error: "No se pudo validar la sesión de Google" },
        { status: 401 },
      );
    }

    setAuthCookies(context, session);

    return Response.json({
      user: buildUserPayload(data.user),
      message: "Sesión iniciada con Google",
    });
  } catch (error) {
    console.error("Error en /api/auth/restore:", error);
    return Response.json(
      { error: "No se pudo restaurar la sesión" },
      { status: 500 },
    );
  }
};
