// Запись собранного каталога в базу. Принимает любой драйвер Drizzle для Postgres
// (neon-http в приложении, PGlite в проверках), поэтому тип — общий PgDatabase.
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

import * as s from "../../shared/db/schema";

import type { Built } from "./build";

export type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>;

const CHUNK = 1000;

function chunks<T>(items: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const must = <K, V>(map: Map<K, V>, key: K, what: string): V => {
  const value = map.get(key);
  if (value === undefined) throw new Error(`Не найдено: ${what} ${String(key)}`);
  return value;
};

export async function writeCatalog(db: AnyDb, built: Built): Promise<void> {
  // Чистим только таблицы каталога; идентификаторы начинаются заново.
  await db.execute(
    sql`truncate table product_attributes, product_images, products, attribute_options, attribute_defs, sellers, brands, categories restart identity cascade`,
  );

  // Категории: сначала корни, затем дети (нужен id родителя).
  const categoryId = new Map<string, number>();
  for (const level of [0, 1]) {
    const rows = built.categories.filter((c) => c.depth === level);
    const inserted = await db
      .insert(s.categories)
      .values(
        rows.map((c) => ({
          slug: c.slug,
          name: c.name,
          path: c.path,
          depth: c.depth,
          sort: c.sort,
          parentId: c.parentSlug ? must(categoryId, c.parentSlug, "родитель") : null,
        })),
      )
      .returning({ id: s.categories.id, slug: s.categories.slug });
    for (const r of inserted) categoryId.set(r.slug, r.id);
  }

  const brandId = new Map<string, number>();
  for (const r of await db
    .insert(s.brands)
    .values(built.brands)
    .returning({ id: s.brands.id, slug: s.brands.slug }))
    brandId.set(r.slug, r.id);

  const sellerId = new Map<string, number>();
  for (const r of await db
    .insert(s.sellers)
    .values(built.sellers)
    .returning({ id: s.sellers.id, slug: s.sellers.slug }))
    sellerId.set(r.slug, r.id);

  // Определения атрибутов и их значения.
  const attrId = new Map<string, number>(); // `${category}|${key}`
  const defs = await db
    .insert(s.attributeDefs)
    .values(
      built.attrDefs.map((d) => ({
        categoryId: must(categoryId, d.categorySlug, "категория"),
        key: d.key,
        name: d.name,
        type: d.type,
        unit: d.unit,
        isMulti: d.isMulti,
        layer: d.layer,
        sort: d.sort,
      })),
    )
    .returning({ id: s.attributeDefs.id });
  built.attrDefs.forEach((d, i) =>
    attrId.set(`${d.categorySlug}|${d.key}`, (defs[i] as { id: number }).id),
  );

  const optionId = new Map<string, number>(); // `${category}|${key}|${value}`
  for (const part of chunks(built.options)) {
    const rows = await db
      .insert(s.attributeOptions)
      .values(
        part.map((o) => ({
          attrId: must(attrId, `${o.categorySlug}|${o.attrKey}`, "атрибут"),
          value: o.value,
          label: o.label,
          hex: o.hex,
          sort: o.sort,
        })),
      )
      .returning({ id: s.attributeOptions.id });
    part.forEach((o, i) =>
      optionId.set(
        `${o.categorySlug}|${o.attrKey}|${o.value}`,
        (rows[i] as { id: number }).id,
      ),
    );
  }

  // Товары, затем картинки и значения атрибутов.
  for (const part of chunks(built.products, 500)) {
    const rows = await db
      .insert(s.products)
      .values(
        part.map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          categoryId: must(categoryId, p.categorySlug, "категория"),
          brandId: must(brandId, p.brandSlug, "бренд"),
          sellerId: must(sellerId, p.sellerSlug, "продавец"),
          price: p.price,
          oldPrice: p.oldPrice,
          rating: p.rating,
          reviewsCount: p.reviewsCount,
          stock: p.stock,
          deliveryDays: p.deliveryDays,
          isOriginal: p.isOriginal,
          popularity: p.popularity,
        })),
      )
      .returning({ id: s.products.id });

    const images: (typeof s.productImages.$inferInsert)[] = [];
    const attributes: (typeof s.productAttributes.$inferInsert)[] = [];
    part.forEach((p, i) => {
      const productId = (rows[i] as { id: number }).id;
      p.images.forEach((url, sort) => images.push({ productId, url, sort }));
      for (const a of p.attrs) {
        attributes.push({
          productId,
          attrId: must(attrId, `${p.categorySlug}|${a.key}`, "атрибут"),
          optionId: a.option
            ? must(optionId, `${p.categorySlug}|${a.key}|${a.option}`, "значение")
            : null,
          numValue: a.num ?? null,
        });
      }
    });
    for (const imgPart of chunks(images))
      await db.insert(s.productImages).values(imgPart);
    for (const attrPart of chunks(attributes))
      await db.insert(s.productAttributes).values(attrPart);
  }
}
