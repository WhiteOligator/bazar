import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching из шаблона убраны намеренно:
  // они меняют модель кэширования и несовместимы с классическими
  // `export const revalidate` / `dynamic`, на которых строится наш ISR/SSG-план.
  // Вернёмся к ним отдельным экспериментом (PPR) позже.

  // Tailwind v4 в Turbopack: без этого загрузчика `@import "tailwindcss"`
  // в globals.css не обрабатывается и утилитарные классы не генерируются.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
