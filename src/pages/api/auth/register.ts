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

    if (password.length < 6) {
      return Response.json(
        { error: "La password debe tener al menos 6 caracteres" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (data.session) {
      setAuthCookies(context, data.session);
    }

    return Response.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email ?? email,
          }
        : null,
      needsEmailConfirmation: !data.session,
      message: data.session
        ? "Usuario registrado correctamente"
        : "Registro creado. Revisa tu email para confirmar la cuenta.",
    });
  } catch (error) {
    console.error("Error en /api/auth/register:", error);

    return Response.json(
      { error: "No se pudo registrar el usuario" },
      { status: 500 },
    );
  }
};
