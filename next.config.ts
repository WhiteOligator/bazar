import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents / partialPrefetching из шаблона убраны намеренно:
  // они меняют модель кэширования и несовместимы с классическими
  // `export const revalidate` / `dynamic`, на которых строится наш ISR/SSG-план.
  // Вернёмся к ним отдельным экспериментом (PPR) позже.
};

export default nextConfig;
