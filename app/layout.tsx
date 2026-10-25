import type { Metadata } from "next";
import "./globals.css";
import "@whiteoligator/drill-kit/styles-no-preflight.css";
import { SiteHeader } from "@/shared/ui/site-header";

import { Providers } from "./providers";

// Временно статика, как в макете. Откуда брать на самом деле — см. docs/storefront-spec.md
const NAV_CATEGORIES = [
  { name: "Электроника", href: "/catalog/electronics" },
  { name: "Бытовая техника", href: "/catalog/appliances" },
  { name: "Одежда и обувь", href: "/catalog/fashion" },
  { name: "Детям", href: "/catalog/kids" },
];

export const metadata: Metadata = {
  title: "Bazar",
  description: "Учебный маркетплейс на Next.js и drill-kit",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru">
      <body>
        <Providers>
          <SiteHeader categories={NAV_CATEGORIES} />
          {children}
        </Providers>
      </body>
    </html>
  );
}
