import { defineConfig } from "drizzle-kit";

// drizzle-kit сам не читает .env.local — подгружаем (Node 20.12+).
try {
  process.loadEnvFile(".env.local");
} catch {
  // файла нет (CI): переменные должны прийти из окружения
}

// Миграциям нужно прямое подключение (UNPOOLED), а не pooled.
export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? "",
  },
});
