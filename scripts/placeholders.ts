// Запуск: npm run db:placeholders. Рисует SVG-заглушки в public/products/<модель>.svg.
// Настоящие фото потом просто заменяют файлы с теми же именами (или меняют url в базе).
import { mkdirSync, writeFileSync } from "node:fs";

import { buildCatalog } from "./seed/build";

const dir = "public/products";
mkdirSync(dir, { recursive: true });

const escapeXml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const hue = (s: string): number =>
  [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

const { models } = buildCatalog();
for (const m of models) {
  const h = hue(m.brand);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${escapeXml(`${m.brand} ${m.name}`)}">
  <rect width="600" height="600" fill="hsl(${h} 22% 93%)"/>
  <rect x="150" y="110" width="300" height="380" rx="28" fill="hsl(${h} 30% 84%)" stroke="hsl(${h} 30% 60%)" stroke-width="3"/>
  <text x="300" y="320" text-anchor="middle" font-family="system-ui, sans-serif" font-size="96" font-weight="600" fill="hsl(${h} 35% 32%)">${escapeXml(m.brand.slice(0, 2).toUpperCase())}</text>
  <text x="300" y="540" text-anchor="middle" font-family="system-ui, sans-serif" font-size="30" fill="hsl(${h} 25% 38%)">${escapeXml(`${m.brand} ${m.name}`)}</text>
</svg>
`;
  writeFileSync(`${dir}/${m.slug}.svg`, svg);
}
console.log(`Заглушек: ${models.length}`);
