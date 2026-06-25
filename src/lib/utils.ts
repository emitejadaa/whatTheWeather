export function normalizeCity(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildCityQuery(city: string): string {
  return normalizeCity(city).toLowerCase();
}

export function normalizeDestination(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function buildDestinationQuery(destination: string): string {
  return normalizeDestination(destination).toLowerCase();
}

export function getSslErrorCode(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof (error as Record<string, unknown>).cause === "object" &&
    (error as Record<string, unknown>).cause !== null &&
    "code" in ((error as { cause: Record<string, unknown> }).cause) &&
    typeof (error as { cause: { code: unknown } }).cause.code === "string"
  ) {
    return (error as { cause: { code: string } }).cause.code;
  }

  return "";
}

export function getWeatherSymbol(text: string): string {
  const lower = text.toLowerCase();

  if (lower.includes("thunder") || lower.includes("tormenta")) return "⛈️";
  if (
    lower.includes("rain") ||
    lower.includes("lluvia") ||
    lower.includes("drizzle") ||
    lower.includes("llovizna")
  )
    return "🌧️";
  if (
    lower.includes("snow") ||
    lower.includes("nieve") ||
    lower.includes("sleet") ||
    lower.includes("blizzard")
  )
    return "❄️";
  if (
    lower.includes("fog") ||
    lower.includes("niebla") ||
    lower.includes("mist") ||
    lower.includes("neblina")
  )
    return "🌫️";
  if (lower.includes("overcast") || lower.includes("nublado")) return "☁️";
  if (
    lower.includes("cloudy") ||
    lower.includes("nube") ||
    lower.includes("partly")
  )
    return "⛅";

  return "☀️";
}

export function calculateTripDurationDays(
  startDate: string,
  endDate: string,
): number {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();

  return Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24));
}

export function isValidPassword(password: string): boolean {
  return typeof password === "string" && password.length >= 6;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
