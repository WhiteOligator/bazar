const nf = new Intl.NumberFormat("ru-RU");

/** Копейки → "79 990 ₽" */
export function formatPrice(kopecks: number): string {
  return `${nf.format(Math.round(kopecks / 100))} ₽`;
}

/** Скидка в процентах относительно старой цены. */
export function discountPercent(price: number, oldPrice: number | null): number {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round((1 - price / oldPrice) * 100);
}
