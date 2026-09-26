import postgres from "postgres";

const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

export function getSql(): postgres.Sql {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  if (!globalForDb.sql) {
    globalForDb.sql = postgres(url, { max: 10, prepare: false });
  }
  return globalForDb.sql;
}
