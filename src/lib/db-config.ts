import type { PoolConfig } from "pg";

export function databasePoolConfig(connectionString: string | undefined): PoolConfig {
  return { connectionString, connectionTimeoutMillis: 5000, query_timeout: 15000 };
}
