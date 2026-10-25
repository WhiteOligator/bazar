import { z } from "zod";

// Единственное место, где читается process.env (остальным запрещено правилом
// ESLint). Забытая переменная падает здесь, при старте, а не в проде в рантайме.
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Pooled-строка Neon (её подставляет интеграция Vercel). Для запросов приложения.
  DATABASE_URL: z.string().url(),
});

export const env = schema.parse(process.env);
