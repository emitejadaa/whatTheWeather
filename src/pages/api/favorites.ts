import type { APIRoute } from "astro";
import { requireAuth } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase";

export const prerender = false;

function normalizeCity(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildCityQuery(city: string) {
  return normalizeCity(city).toLowerCase();
}

export const GET: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    if (!auth) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(auth.accessToken);
    const { data, error } = await supabase
      .from("favorite_cities")
      .select("id, city_name, city_query, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ favorites: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/favorites:", error);

    return Response.json(
      { error: "No se pudieron cargar los favoritos" },
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    if (!auth) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await context.request.json().catch(() => null);
    const rawCity = typeof body?.city === "string" ? body.city : "";
    const cityName = normalizeCity(rawCity);
    const cityQuery = buildCityQuery(rawCity);

    if (!cityName) {
      return Response.json(
        { error: "La ciudad es obligatoria" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient(auth.accessToken);
    const { data, error } = await supabase
      .from("favorite_cities")
      .upsert(
        {
          user_id: auth.user.id,
          city_name: cityName,
          city_query: cityQuery,
        },
        {
          onConflict: "user_id,city_query",
        },
      )
      .select("id, city_name, city_query, created_at")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      favorite: data,
      message: "Ciudad agregada a favoritos",
    });
  } catch (error) {
    console.error("Error en POST /api/favorites:", error);

    return Response.json(
      { error: "No se pudo guardar el favorito" },
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    if (!auth) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await context.request.json().catch(() => null);
    const cityQuery =
      typeof body?.city === "string" ? buildCityQuery(body.city) : "";

    if (!cityQuery) {
      return Response.json(
        { error: "La ciudad es obligatoria" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient(auth.accessToken);
    const { error } = await supabase
      .from("favorite_cities")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("city_query", cityQuery);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      ok: true,
      message: "Ciudad eliminada de favoritos",
    });
  } catch (error) {
    console.error("Error en DELETE /api/favorites:", error);

    return Response.json(
      { error: "No se pudo eliminar el favorito" },
      { status: 500 },
    );
  }
};
