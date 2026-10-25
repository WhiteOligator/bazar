import { Button } from "@whiteoligator/drill-kit";
import Link from "next/link";

import { SearchBox } from "./search-box";

export type HeaderCategory = { name: string; href: string };

type Counters = { orders?: number; favorites?: number; cart?: number };

type Props = {
  categories: HeaderCategory[];
  counters?: Counters;
  city?: string;
};

const ICONS = {
  login:
    "M12 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2z M4.8 20c0-3.5 3.3-5.8 7.2-5.8s7.2 2.3 7.2 5.8",
  orders:
    "M4.2 7.8L12 4l7.8 3.8v8.4L12 20l-7.8-3.8z M4.2 7.8L12 11.6l7.8-3.8 M12 11.6V20",
  favorites:
    "M12 20s-7.4-4.6-7.4-9.3A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7.4 2.7C19.4 15.4 12 20 12 20z",
  cart: "M3.4 5h2.3l2.1 10.2h9.4L19.6 8H7.2 M9.6 19.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z M17 19.2a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6z",
};

export function SiteHeader({ categories, counters = {}, city = "Москва" }: Props) {
  const actions = [
    { name: "Войти", href: "/login", d: ICONS.login },
    { name: "Заказы", href: "/orders", d: ICONS.orders, badge: counters.orders },
    {
      name: "Избранное",
      href: "/favorites",
      d: ICONS.favorites,
      badge: counters.favorites,
    },
    { name: "Корзина", href: "/cart", d: ICONS.cart, badge: counters.cart },
  ];

  return (
    <>
      <div className="border-b border-[var(--border-default)] bg-[var(--bg-neutral)]">
        <div className="mx-auto flex max-w-[1392px] flex-wrap items-center gap-[18px] px-6 py-[7px] text-[12.5px] text-[var(--text-secondary)]">
          <span className="inline-flex items-center gap-1.5 py-1">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M12 21s-6.5-5.6-6.5-10.2A6.5 6.5 0 0 1 18.5 10.8C18.5 15.4 12 21 12 21z" />
              <circle cx="12" cy="10.5" r="2.4" />
            </svg>
            {city}
          </span>
          <span className="text-[var(--text-tertiary)]">
            Доставка в пункт выдачи от 1 дня
          </span>
          <nav className="ml-auto flex flex-wrap gap-[18px]">
            <Link href="/seller" className="hover:text-[var(--text-brand)]">
              Продавайте на Базаре
            </Link>
            <Link href="/orders" className="hover:text-[var(--text-brand)]">
              Мои заказы
            </Link>
            <Link href="/help" className="hover:text-[var(--text-brand)]">
              Помощь
            </Link>
          </nav>
        </div>
      </div>

      <header className="border-b border-[var(--border-default)] bg-[var(--bg-container)]">
        <div className="mx-auto flex max-w-[1392px] flex-wrap items-center gap-3.5 px-6 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-[9px]">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--bg-brand)] text-lg font-bold text-[var(--text-on-brand)]">
              Б
            </span>
            <span className="text-xl font-bold tracking-[-0.01em]">Базар</span>
          </Link>

          <Button asChild variant="primary" size="md" testId="header-catalog">
            <Link href="/catalog/electronics">Каталог</Link>
          </Button>

          <div className="min-w-0 flex-[999_1_340px]">
            <SearchBox />
          </div>

          <nav className="flex shrink-0 items-center gap-0.5">
            {actions.map((a) => (
              <Link
                key={a.name}
                href={a.href}
                className="relative flex min-h-11 min-w-[62px] flex-col items-center justify-center gap-[3px] px-2.5 py-[5px] hover:text-[var(--text-brand)]"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={a.d} />
                </svg>
                <span className="text-[11px] text-[var(--text-secondary)]">{a.name}</span>
                {a.badge ? (
                  <span className="absolute top-px right-2.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-[9px] bg-[var(--bg-brand)] px-1 text-[10.5px] font-bold text-[var(--text-on-brand)]">
                    {a.badge}
                  </span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>

        <nav
          aria-label="Категории"
          className="mx-auto flex max-w-[1392px] flex-wrap gap-5 px-6 pb-2.5 text-[13.5px]"
        >
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="py-1 text-[var(--text-secondary)] hover:text-[var(--text-brand)]"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
