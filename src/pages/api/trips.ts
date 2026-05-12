import type { APIRoute } from "astro";
import { requireAuth } from "../../lib/auth";
import { createSupabaseServerClient } from "../../lib/supabase";

export const prerender = false;

function normalizeDestination(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function buildDestinationQuery(destination: string) {
  return normalizeDestination(destination).toLowerCase();
}

export const GET: APIRoute = async (context) => {
  try {
    const auth = await requireAuth(context);

    if (!auth) {
      return Response.json({ error: "No autenticado" }, { status: 401 });
    }

    const supabase = createSupabaseServerClient(auth.accessToken);
    const { data, error } = await supabase
      .from("trips")
      .select("id, trip_name, destination_name, destination_query, start_date, end_date, created_at")
      .eq("user_id", auth.user.id)
      .order("start_date", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ trips: data ?? [] });
  } catch (error) {
    console.error("Error en GET /api/trips:", error);

    return Response.json(
      { error: "No se pudieron cargar los viajes" },
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
    const tripName = typeof body?.tripName === "string" ? body.tripName.trim() : "";
    const destination = typeof body?.destination === "string" ? body.destination : "";
    const startDate = typeof body?.startDate === "string" ? body.startDate : "";
    const endDate = typeof body?.endDate === "string" ? body.endDate : "";

    // Validar campos requeridos
    if (!tripName || !destination || !startDate || !endDate) {
      return Response.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    // Validar formato de fechas
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return Response.json(
        { error: "Las fechas deben estar en formato válido (YYYY-MM-DD)" },
        { status: 400 },
      );
    }

    // Validar que startDate no sea posterior a endDate
    if (startDateObj > endDateObj) {
      return Response.json(
        { error: "La fecha de inicio no puede ser posterior a la fecha de fin" },
        { status: 400 },
      );
    }

    // Validar duración máxima (30 días)
    const durationMs = endDateObj.getTime() - startDateObj.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (durationDays > 30) {
      return Response.json(
        { error: "El viaje no puede exceder 30 días" },
        { status: 400 },
      );
    }

    const destinationName = normalizeDestination(destination);
    const destinationQuery = buildDestinationQuery(destination);

    const supabase = createSupabaseServerClient(auth.accessToken);
    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: auth.user.id,
        trip_name: tripName,
        destination_name: destinationName,
        destination_query: destinationQuery,
        start_date: startDate,
        end_date: endDate,
      })
      .select("id, trip_name, destination_name, destination_query, start_date, end_date, created_at")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      trip: data,
      message: "Viaje guardado correctamente",
    });
  } catch (error) {
    console.error("Error en POST /api/trips:", error);

    return Response.json(
      { error: "No se pudo guardar el viaje" },
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

    // Obtener el ID del viaje desde query param o body
    const tripId = context.url.searchParams.get("id");
    const body = await context.request.json().catch(() => null);
    const bodyTripId = typeof body?.id === "string" ? body.id : "";
    const finalTripId = tripId || bodyTripId;

    if (!finalTripId) {
      return Response.json(
        { error: "ID del viaje es obligatorio" },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient(auth.accessToken);

    // Verificar que el viaje pertenece al usuario
    const { data: tripData, error: selectError } = await supabase
      .from("trips")
      .select("id")
      .eq("id", finalTripId)
      .eq("user_id", auth.user.id)
      .single();

    if (selectError || !tripData) {
      return Response.json(
        { error: "Viaje no encontrado o no autorizado" },
        { status: 404 },
      );
    }

    // Eliminar el viaje
    const { error: deleteError } = await supabase
      .from("trips")
      .delete()
      .eq("id", finalTripId)
      .eq("user_id", auth.user.id);

    if (deleteError) {
      return Response.json({ error: deleteError.message }, { status: 400 });
    }

    return Response.json({ message: "Viaje eliminado correctamente" });
  } catch (error) {
    console.error("Error en DELETE /api/trips:", error);

    return Response.json(
      { error: "No se pudo eliminar el viaje" },
      { status: 500 },
    );
  }
};
