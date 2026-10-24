import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import boundaries from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // --- Архитектура: app → features → shared ---------------------------------
  // app      — только маршруты и композиция (страницы, layout, providers)
  // features — вертикальные срезы (catalog, cart, auth…); сосед о соседе не знает
  // shared   — kit-обёртки, db, утилиты; ничего не знает о features и app
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "app" },
        { type: "feature", pattern: "features/*", capture: ["feature"] },
        { type: "shared", pattern: "shared" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          policies: [
            { allow: { to: { origin: ["external", "core"] } } },
            {
              from: { element: { type: "app" } },
              allow: { to: { element: { type: ["app", "feature", "shared"] } } },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: [
                  { element: { type: "shared" } },
                  {
                    element: {
                      type: "feature",
                      captured: { feature: "{{ from.captured.feature }}" },
                    },
                  },
                ],
              },
            },
            {
              from: { element: { type: "shared" } },
              allow: { to: { element: { type: "shared" } } },
            },
          ],
        },
      ],
    },
  },

  // --- Публичные входы drill-kit и доступ к process.env ----------------------
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@whiteoligator/drill-kit/dist/*",
                "@whiteoligator/drill-kit/src/*",
              ],
              message: "Только публичные входы: корень, /icons, /table.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Читайте переменные окружения через shared/config/env.ts.",
        },
      ],
    },
  },
  {
    files: ["shared/config/env.ts", "next.config.ts", "*.config.{js,mjs,ts}"],
    rules: { "no-restricted-syntax": "off" },
  },

  // Prettier — последним: выключает правила форматирования, конфликтующие с ним.
  prettier,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
