import { createServer, type Socket } from "node:net";
import { Pool } from "pg";
import { afterEach, describe, expect, it } from "vitest";
import { databasePoolConfig } from "@/lib/db-config";

describe("databasePoolConfig", () => {
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("error", () => {});
  });
  afterEach(() => {
    sockets.forEach((socket) => socket.destroy());
    return new Promise((resolve) => server.close(resolve));
  });

  it("fails instead of hanging on a silent database", async () => {
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address() as { port: number };
    const config = databasePoolConfig(`postgresql://u:p@127.0.0.1:${port}/db`);
    expect(config.connectionTimeoutMillis).toBeGreaterThan(0);
    expect(config.connectionTimeoutMillis).toBeLessThanOrEqual(5000);
    expect(config.query_timeout).toBeGreaterThan(0);

    const pool = new Pool({ ...config, connectionTimeoutMillis: 100 });
    await expect(pool.query("SELECT 1")).rejects.toThrow();
    await pool.end().catch(() => {});
  });
});
