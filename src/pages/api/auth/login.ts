import type { APIRoute } from "astro";
import { setAuthCookies } from "../../../lib/auth";
import { createSupabaseServerClient } from "../../../lib/supabase";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const body = await context.request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email y password son obligatorios" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      return Response.json(
        { error: error?.message || "No se pudo iniciar sesion" },
        { status: 401 },
      );
    }

    setAuthCookies(context, data.session);

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email ?? email,
      },
      message: "Sesion iniciada correctamente",
    });
  } catch (error) {
    console.error("Error en /api/auth/login:", error);

    return Response.json(
      { error: "No se pudo iniciar sesion" },
      { status: 500 },
    );
  }
};
