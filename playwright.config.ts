import { defineConfig, devices } from "@playwright/test";

const port = process.env.DOSVY_E2E_PORT;
if (!port || !/^\d+$/.test(port)) {
  throw new Error("Run E2E tests with npm run test:e2e to allocate a dedicated port.");
}

const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "./test-results/e2e",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      CI: "1",
      NODE_ENV: "production",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_OPTIONS: "",
      DATABASE_URL: "",
      TEST_DATABASE_URL: "",
      PGHOST: "",
      PGPORT: "",
      PGUSER: "",
      PGPASSWORD: "",
      PGDATABASE: "",
      POSTGRES_USER: "",
      POSTGRES_PASSWORD: "",
      POSTGRES_DB: "",
    },
  },
});
