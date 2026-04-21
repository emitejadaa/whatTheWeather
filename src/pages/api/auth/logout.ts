import type { APIRoute } from "astro";
import { clearAuthCookies, requireAuth } from "../../../lib/auth";
import { createSupabaseServerClient } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    if (auth?.accessToken) {
      const supabase = createSupabaseServerClient(auth.accessToken);
      await supabase.auth.signOut();
    }

    clearAuthCookies(context);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error en /api/auth/logout:", error);
    clearAuthCookies(context);

    return Response.json({ ok: true });
  }
};
