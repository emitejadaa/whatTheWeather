import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    const destination =
      typeof body?.destination === "string" ? body.destination.trim() : "";
    const startDate = typeof body?.startDate === "string" ? body.startDate : "";
    const endDate = typeof body?.endDate === "string" ? body.endDate : "";

    if (!destination || !startDate || !endDate) {
      return Response.json(
        { error: "Destination, startDate y endDate son obligatorios" },
        { status: 400 }
      );
    }

    const apiKey = import.meta.env.WEATHER_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "WEATHER_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular días desde hoy hasta el viaje
    const daysUntilStart = Math.ceil(
      (startDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysUntilEnd = Math.ceil(
      (endDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // WeatherAPI permite hasta 10 días de forecast (plan gratuito 3, plan premium 10)
    const maxForecastDays = 10;
    const daysToForecast = Math.min(daysUntilEnd + 1, maxForecastDays);

    if (daysUntilStart > maxForecastDays) {
      // El viaje es demasiado lejano
      return Response.json({
        destination,
        startDate,
        endDate,
        availableForecast: false,
        reason: "El viaje está demasiado lejos. El pronóstico estará disponible cuando falten menos días.",
        forecastDays: [],
      });
    }

    // Solicitar el forecast a WeatherAPI
    const apiUrl = new URL("https://api.weatherapi.com/v1/forecast.json");
    apiUrl.searchParams.set("key", apiKey);
    apiUrl.searchParams.set("q", destination);
    apiUrl.searchParams.set("days", Math.max(1, daysToForecast).toString());
    apiUrl.searchParams.set("aqi", "no");

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return Response.json(
        {
          error:
            typeof error === "object" &&
            error !== null &&
            "error" in error &&
            typeof error.error === "object" &&
            error.error !== null &&
            "message" in error.error
              ? (error.error as { message: string }).message
              : "No se pudo obtener el pronóstico",
        },
        { status: response.status }
      );
    }

    const weatherData = await response.json();

    // Filtrar los días que caen dentro del rango del viaje
    const forecastDays = [];

    if (weatherData.forecast && weatherData.forecast.forecastday) {
      for (const day of weatherData.forecast.forecastday) {
        const dayDate = new Date(day.date);

        if (dayDate >= startDateObj && dayDate <= endDateObj) {
          forecastDays.push({
            date: day.date,
            maxTempC: day.day.maxtemp_c,
            minTempC: day.day.mintemp_c,
            avgTempC: day.day.avgtemp_c,
            condition: day.day.condition.text,
            conditionIcon: day.day.condition.icon,
            chanceOfRain: day.day.daily_chance_of_rain,
            humidity: day.day.avg_humidity,
          });
        }
      }
    }

    return Response.json({
      destination,
      startDate,
      endDate,
      availableForecast: forecastDays.length > 0,
      reason:
        forecastDays.length === 0 && daysUntilStart > 0
          ? "El pronóstico estará disponible cuando falten menos días."
          : undefined,
      forecastDays,
    });
  } catch (error) {
    console.error("Error en GET /api/trips/weather:", error);

    return Response.json(
      { error: "No se pudo obtener el pronóstico del viaje" },
      { status: 500 }
    );
  }
};
