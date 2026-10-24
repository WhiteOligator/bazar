"use client";

import { LanguageProvider, LinkProvider } from "@whiteoligator/drill-kit";
import NextLink from "next/link";

// NextLink делает внутренние ссылки drill-kit (TextLink, Breadcrumbs)
// клиентскими переходами с prefetch, без перезагрузки страницы.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider language="ru-RU">
      <LinkProvider component={NextLink}>{children}</LinkProvider>
    </LanguageProvider>
  );
}
