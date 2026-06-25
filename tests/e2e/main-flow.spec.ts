import { test, expect } from "@playwright/test";

const MOCK_WEATHER = {
  location: {
    name: "Buenos Aires",
    country: "Argentina",
    localtime: "2025-06-23 14:00",
  },
  current: {
    temp_c: 20,
    feelslike_c: 18,
    condition: {
      text: "Partly cloudy",
      icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
    },
    humidity: 60,
    wind_kph: 15,
    pressure_mb: 1013,
    vis_km: 10,
  },
  forecast: {
    forecastday: [
      {
        date: "2025-06-23",
        day: {
          maxtemp_c: 22,
          mintemp_c: 15,
          condition: { text: "Partly cloudy", icon: "" },
        },
        hour: [],
      },
    ],
  },
};

test.describe("Flujo principal de la aplicación", () => {
  test("la página principal carga con el formulario de búsqueda visible", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/whattheweather/i);
    await expect(page.locator("#city-input")).toBeVisible();
    await expect(page.locator("#search-button")).toBeVisible();
  });

  test("el usuario puede buscar una ciudad y ver el resultado del clima", async ({
    page,
  }) => {
    await page.route("**/api/weather", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_WEATHER),
      });
    });

    await page.goto("/");

    await page.locator("#city-input").fill("Buenos Aires");
    await page.locator("#search-button").click();

    await expect(page.locator("#hero-city")).toContainText("Buenos Aires", {
      timeout: 10000,
    });
    await expect(page.locator("#hero-temp")).toContainText("20", {
      timeout: 10000,
    });
  });

  test("el botón Acceder abre el modal de autenticación con campo de email", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator("#auth-open-button-hero").click();

    await expect(page.locator("#auth-modal")).not.toHaveClass(/hidden/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
