import type { APIRoute } from "astro";

export const prerender = false;

function getSslErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof error.cause === "object" &&
    error.cause !== null &&
    "code" in error.cause &&
    typeof error.cause.code === "string"
  ) {
    return error.cause.code;
  }

  return "";
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log("Metodo recibido:", request.method);
    console.log("Headers content-type:", request.headers.get("content-type"));

    const rawBody = await request.text();
    console.log("Body crudo recibido:", rawBody);

    let body: unknown = null;

    try {
      body = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      return new Response(
        JSON.stringify({ error: "El body no es JSON valido" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const city =
      typeof body === "object" &&
      body !== null &&
      "city" in body &&
      typeof body.city === "string"
        ? body.city.trim()
        : "";

    console.log("Ciudad parseada:", city);

    if (!city) {
      return new Response(
        JSON.stringify({ error: "Falta la ciudad en el body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = import.meta.env.WEATHER_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Falta configurar WEATHER_API_KEY en .env.local",
        }),
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

    const apiResponse = await fetch(apiUrl);
    const apiText = await apiResponse.text();

    if (!apiResponse.ok) {
      console.log("Respuesta de WeatherAPI con error:", apiText);

      let parsedError: any = null;
      try {
        parsedError = JSON.parse(apiText);
      } catch {}

      return new Response(
        JSON.stringify({
          error: parsedError?.error?.message || "No se pudo obtener el clima",
        }),
        {
          status: apiResponse.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(apiText, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error en /api/weather:", error);

    const sslErrorCode = getSslErrorCode(error);

    if (
      sslErrorCode === "SELF_SIGNED_CERT_IN_CHAIN" ||
      sslErrorCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "No se pudo conectar con WeatherAPI por un certificado HTTPS local o interceptado. Revisa proxy, antivirus, VPN o certificados corporativos en tu equipo.",
        }),
        {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Ocurrio un error inesperado al consultar el clima",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
