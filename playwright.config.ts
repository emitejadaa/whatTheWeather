import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      WEATHER_API_KEY: process.env.WEATHER_API_KEY ?? "test-key",
      PUBLIC_WEATHER_API_KEY: process.env.PUBLIC_WEATHER_API_KEY ?? "test-key",
      SUPABASE_URL: process.env.SUPABASE_URL ?? "http://localhost:54321",
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "test-anon-key",
    },
  },
});
