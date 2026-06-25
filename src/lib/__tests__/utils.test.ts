import { describe, it, expect } from "vitest";
import {
  normalizeCity,
  buildCityQuery,
  normalizeDestination,
  buildDestinationQuery,
  getSslErrorCode,
  getWeatherSymbol,
  calculateTripDurationDays,
  isValidPassword,
  escapeHtml,
} from "../utils";

describe("normalizeCity", () => {
  it("recorta espacios al inicio y al final", () => {
    expect(normalizeCity("  Buenos Aires  ")).toBe("Buenos Aires");
  });

  it("colapsa múltiples espacios en uno solo", () => {
    expect(normalizeCity("Buenos   Aires")).toBe("Buenos Aires");
  });

  it("devuelve string vacío para entrada vacía", () => {
    expect(normalizeCity("")).toBe("");
  });

  it("deja sin cambios una ciudad de una sola palabra", () => {
    expect(normalizeCity("Madrid")).toBe("Madrid");
  });
});

describe("buildCityQuery", () => {
  it("convierte el nombre a minúsculas", () => {
    expect(buildCityQuery("Buenos Aires")).toBe("buenos aires");
  });

  it("recorta y convierte a minúsculas", () => {
    expect(buildCityQuery("  CÓRDOBA  ")).toBe("córdoba");
  });

  it("colapsa espacios y convierte a minúsculas", () => {
    expect(buildCityQuery("San   Pablo")).toBe("san pablo");
  });
});

describe("normalizeDestination", () => {
  it("recorta espacios alrededor del destino", () => {
    expect(normalizeDestination("  Madrid  ")).toBe("Madrid");
  });

  it("colapsa múltiples espacios en uno", () => {
    expect(normalizeDestination("San  José")).toBe("San José");
  });

  it("devuelve string vacío para entrada vacía", () => {
    expect(normalizeDestination("")).toBe("");
  });
});

describe("buildDestinationQuery", () => {
  it("devuelve el destino normalizado en minúsculas", () => {
    expect(buildDestinationQuery("  Río de Janeiro  ")).toBe("río de janeiro");
  });

  it("maneja entrada ya normalizada", () => {
    expect(buildDestinationQuery("paris")).toBe("paris");
  });
});

describe("getSslErrorCode", () => {
  it("devuelve string vacío para null", () => {
    expect(getSslErrorCode(null)).toBe("");
  });

  it("devuelve string vacío para un string", () => {
    expect(getSslErrorCode("algún error")).toBe("");
  });

  it("extrae el código de error SSL del objeto cause anidado", () => {
    const error = { cause: { code: "SELF_SIGNED_CERT_IN_CHAIN" } };
    expect(getSslErrorCode(error)).toBe("SELF_SIGNED_CERT_IN_CHAIN");
  });

  it("devuelve string vacío si cause no tiene la propiedad code", () => {
    const error = { cause: { message: "algún error" } };
    expect(getSslErrorCode(error)).toBe("");
  });

  it("devuelve string vacío para un Error sin cause", () => {
    const error = new Error("error común");
    expect(getSslErrorCode(error)).toBe("");
  });
});

describe("getWeatherSymbol", () => {
  it("devuelve emoji de tormenta para condiciones de truenos", () => {
    expect(getWeatherSymbol("Thunderstorm")).toBe("⛈️");
    expect(getWeatherSymbol("tormenta eléctrica")).toBe("⛈️");
  });

  it("devuelve emoji de lluvia para condiciones lluviosas", () => {
    expect(getWeatherSymbol("Heavy rain")).toBe("🌧️");
    expect(getWeatherSymbol("Light drizzle")).toBe("🌧️");
  });

  it("devuelve emoji de nieve para condiciones invernales", () => {
    expect(getWeatherSymbol("Light snow")).toBe("❄️");
    expect(getWeatherSymbol("Blizzard")).toBe("❄️");
  });

  it("devuelve emoji de niebla para condiciones de neblina", () => {
    expect(getWeatherSymbol("Fog")).toBe("🌫️");
    expect(getWeatherSymbol("Mist")).toBe("🌫️");
  });

  it("devuelve emoji de nublado para cielo cubierto", () => {
    expect(getWeatherSymbol("Overcast")).toBe("☁️");
    expect(getWeatherSymbol("Nublado")).toBe("☁️");
  });

  it("devuelve emoji de parcialmente nublado", () => {
    expect(getWeatherSymbol("Partly cloudy")).toBe("⛅");
  });

  it("devuelve emoji de sol para condiciones despejadas", () => {
    expect(getWeatherSymbol("Sunny")).toBe("☀️");
    expect(getWeatherSymbol("Clear")).toBe("☀️");
  });
});

describe("calculateTripDurationDays", () => {
  it("calcula correctamente 3 días de viaje", () => {
    expect(calculateTripDurationDays("2025-01-01", "2025-01-04")).toBe(3);
  });

  it("devuelve 0 para viajes de un solo día", () => {
    expect(calculateTripDurationDays("2025-06-15", "2025-06-15")).toBe(0);
  });

  it("calcula correctamente 30 días de viaje", () => {
    expect(calculateTripDurationDays("2025-01-01", "2025-01-31")).toBe(30);
  });

  it("calcula correctamente una semana de viaje", () => {
    expect(calculateTripDurationDays("2025-03-10", "2025-03-17")).toBe(7);
  });
});

describe("isValidPassword", () => {
  it("devuelve true para contraseña con exactamente 6 caracteres", () => {
    expect(isValidPassword("abc123")).toBe(true);
  });

  it("devuelve true para contraseñas más largas que 6 caracteres", () => {
    expect(isValidPassword("contraseñasegura")).toBe(true);
  });

  it("devuelve false para contraseñas menores a 6 caracteres", () => {
    expect(isValidPassword("12345")).toBe(false);
  });

  it("devuelve false para string vacío", () => {
    expect(isValidPassword("")).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapa etiquetas de script para prevenir XSS", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
  });

  it("escapa ampersands", () => {
    expect(escapeHtml("Pan & Manteca")).toBe("Pan &amp; Manteca");
  });

  it("escapa comillas simples", () => {
    expect(escapeHtml("Manuel's trip")).toBe("Manuel&#39;s trip");
  });

  it("deja el texto plano sin cambios", () => {
    expect(escapeHtml("Hola Mundo")).toBe("Hola Mundo");
  });
});
