import { spawnSync } from "node:child_process";
import { createServer, type AddressInfo } from "node:net";
import { resolve } from "node:path";

async function findAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolveListening, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListening);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Could not allocate a loopback port for the E2E server.");
  }

  await new Promise<void>((resolveClose, reject) => {
    server.close((error) => (error ? reject(error) : resolveClose()));
  });
  return (address as AddressInfo).port;
}

async function main(): Promise<void> {
  const port = await findAvailablePort();
  const cli = resolve(process.cwd(), "node_modules", "playwright", "cli.js");
  const env: NodeJS.ProcessEnv = { ...process.env };

  for (const key of Object.keys(env)) {
    if (/^(DATABASE_URL|TEST_DATABASE_URL|DATABASE_URI|TEST_DATABASE_URI|PG[A-Z0-9_]*|POSTGRES_[A-Z0-9_]*|SUPABASE_DB_URL|NODE_OPTIONS|NO_COLOR)$/i.test(key)) {
      delete env[key];
    }
  }

  const result = spawnSync(process.execPath, [cli, "test"], {
    cwd: process.cwd(),
    env: {
      ...env,
      CI: "1",
      NODE_ENV: "test",
      NEXT_TELEMETRY_DISABLED: "1",
      DOSVY_E2E_PORT: String(port),
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
      NODE_OPTIONS: "",
    },
    stdio: "inherit",
    timeout: 10 * 60 * 1000,
    windowsHide: true,
  });

  if (result.error || result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}

void main().catch(() => {
  console.error("Could not start the isolated Playwright E2E runner.");
  process.exitCode = 1;
});
