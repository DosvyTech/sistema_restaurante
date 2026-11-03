import { getPool } from "@/shared/server/db/client";

export async function GET(): Promise<Response> {
  try {
    await getPool().query("SELECT 1");
    return Response.json({ status: "ready" });
  } catch {
    return Response.json({ status: "not_ready" }, { status: 503 });
  }
}
