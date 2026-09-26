import { readdir, readFile } from "node:fs/promises";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

await sql`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`;

const dir = new URL("../db/migrations/", import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();

for (const file of files) {
  const applied = await sql`SELECT 1 FROM schema_migrations WHERE id = ${file}`;
  if (applied.length > 0) continue;
  const text = await readFile(new URL(file, dir), "utf8");
  await sql.begin(async (tx) => {
    await tx.unsafe(text);
    await tx`INSERT INTO schema_migrations (id) VALUES (${file})`;
  });
  console.log(`applied ${file}`);
}

await sql.end();
console.log("migrate ok");
