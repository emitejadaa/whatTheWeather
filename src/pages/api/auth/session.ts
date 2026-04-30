import type { APIRoute } from "astro";
import { buildUserPayload, requireAuth } from "../../../lib/auth";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    return Response.json({
      authenticated: Boolean(auth?.user),
      user: auth?.user ? buildUserPayload(auth.user) : null,
    });
  } catch (error) {
    console.error("Error en /api/auth/session:", error);

    return Response.json(
      { error: "No se pudo validar la sesion" },
      { status: 500 },
    );
  }
};
