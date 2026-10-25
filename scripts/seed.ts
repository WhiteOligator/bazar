// Запуск: npm run db:seed. Очищает таблицы каталога и заполняет их заново.
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "../shared/config/env";
import * as schema from "../shared/db/schema";

import { buildCatalog, summarize } from "./seed/build";
import { writeCatalog } from "./seed/write";

// Функция, а не top-level await: tsx собирает .ts как CommonJS (в package.json нет "type": "module").
async function main(): Promise<void> {
  const built = buildCatalog();
  console.log("Собрано:", summarize(built));
  console.log("База:", new URL(env.DATABASE_URL).host);

  const db = drizzle({ client: neon(env.DATABASE_URL), schema });
  const started = Date.now();
  await writeCatalog(db, built);
  console.log(`Готово за ${((Date.now() - started) / 1000).toFixed(1)} с`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
