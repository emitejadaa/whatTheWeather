import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const city = url.searchParams.get("city");

    if (!city) {
      return new Response(
        JSON.stringify({ error: "Falta el parámetro city" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = import.meta.env.WEATHER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Falta configurar WEATHER_API_KEY en .env.local" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiUrl = new URL("https://api.weatherapi.com/v1/forecast.json");
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set("q", city);
    apiUrl.searchParams.set("days", "3");
    apiUrl.searchParams.set("aqi", "no");
    apiUrl.searchParams.set("alerts", "no");
    apiUrl.searchParams.set("lang", "es");

    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      return new Response(
        JSON.stringify({
          error: errorData?.error?.message || "No se pudo obtener el clima",
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Ocurrió un error inesperado al consultar el clima",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};