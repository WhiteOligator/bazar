// Чистая сборка каталога в памяти: без базы, детерминированно (один seed — те же данные).
import {
  type AttrValue,
  MODELS,
  type ModelSpec,
  OFFER_TARGETS,
  colorLabel,
} from "./models";
import { createRng } from "./rng";
import { CATEGORIES, OFFICIAL_BRANDS, REGULAR_SELLERS, type AttrSpec } from "./spec";

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type BuiltAttr = { key: string; option?: string; num?: number };

export type BuiltProduct = {
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  brandSlug: string;
  sellerSlug: string;
  /** Копейки. */
  price: number;
  oldPrice: number | null;
  rating: number;
  reviewsCount: number;
  stock: number;
  deliveryDays: number;
  isOriginal: boolean;
  popularity: number;
  images: string[];
  attrs: BuiltAttr[];
};

export type Built = {
  categories: {
    slug: string;
    name: string;
    parentSlug: string | null;
    path: string;
    depth: number;
    sort: number;
  }[];
  brands: { slug: string; name: string }[];
  sellers: { slug: string; name: string; rating: number; isOfficial: boolean }[];
  attrDefs: {
    categorySlug: string;
    key: string;
    name: string;
    type: AttrSpec["type"];
    unit: string | null;
    isMulti: boolean;
    layer: number;
    sort: number;
  }[];
  options: {
    categorySlug: string;
    attrKey: string;
    value: string;
    label: string;
    hex: string | null;
    sort: number;
  }[];
  products: BuiltProduct[];
  /** Уникальные модели — для картинок-заглушек. */
  models: { slug: string; brand: string; name: string; categorySlug: string }[];
};

const gbLabel = (n: number): string => (n >= 1024 ? `${n / 1024} ТБ` : `${n} ГБ`);
const round1 = (n: number): number => Math.round(n * 10) / 10;
const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

type Variant = {
  model: ModelSpec;
  axisValues: Record<string, string>;
  mult: number;
  attrs: Record<string, AttrValue>;
};

function expandVariants(model: ModelSpec): Variant[] {
  let combos: {
    axisValues: Record<string, string>;
    mult: number;
    extra: Record<string, AttrValue>;
  }[] = [{ axisValues: {}, mult: 1, extra: {} }];
  for (const axis of model.axes) {
    combos = combos.flatMap((c) =>
      axis.values.map((v) => ({
        axisValues: { ...c.axisValues, [axis.key]: v.v },
        mult: c.mult * v.mult,
        extra: { ...c.extra, ...(v.extra ?? {}) },
      })),
    );
  }
  return combos.map((c) => {
    const attrs: Record<string, AttrValue> = { ...model.fixed };
    // Значение оси становится атрибутом, если у категории есть атрибут с таким ключом.
    for (const [key, value] of Object.entries(c.axisValues)) attrs[key] = value;
    Object.assign(attrs, c.extra);
    return { model, axisValues: c.axisValues, mult: c.mult, attrs };
  });
}

export function buildCatalog(seed = 20261025): Built {
  const rng = createRng(seed);

  // ── Категории и атрибуты ──
  const categories: Built["categories"] = CATEGORIES.map((c, i) => {
    const parent = c.parent ? CATEGORIES.find((p) => p.slug === c.parent) : undefined;
    if (c.parent && !parent) throw new Error(`Нет родителя ${c.parent} у ${c.slug}`);
    return {
      slug: c.slug,
      name: c.name,
      parentSlug: parent?.slug ?? null,
      path: parent ? `${parent.slug}/${c.slug}` : c.slug,
      depth: parent ? 1 : 0,
      sort: i,
    };
  });

  const attrDefs: Built["attrDefs"] = [];
  const options: Built["options"] = [];
  const defsByCategory = new Map<string, AttrSpec[]>();
  for (const c of CATEGORIES) {
    if (!c.attrs) continue;
    defsByCategory.set(c.slug, c.attrs);
    c.attrs.forEach((a, i) => {
      attrDefs.push({
        categorySlug: c.slug,
        key: a.key,
        name: a.name,
        type: a.type,
        unit: a.unit ?? null,
        isMulti: a.isMulti ?? false,
        layer: a.layer,
        sort: i,
      });
      (a.options ?? []).forEach((o, j) =>
        options.push({
          categorySlug: c.slug,
          attrKey: a.key,
          value: o.value,
          label: o.label,
          hex: o.hex ?? null,
          sort: j,
        }),
      );
    });
  }

  const labelOf = (category: string, key: string, value: string): string => {
    const label = defsByCategory
      .get(category)
      ?.find((a) => a.key === key)
      ?.options?.find((o) => o.value === value)?.label;
    if (!label) throw new Error(`Нет значения ${key}=${value} у категории ${category}`);
    return label;
  };

  // ── Бренды и продавцы ──
  const brandNames = [...new Set(MODELS.map((m) => m.brand))].sort();
  const brands = brandNames.map((name) => ({ slug: slugify(name), name }));

  const sellers: Built["sellers"] = [
    ...OFFICIAL_BRANDS.map((b) => ({
      slug: `official-${slugify(b)}`,
      name: `${b} Official`,
      rating: round1(rng.float(4.7, 5)),
      isOfficial: true,
    })),
    ...REGULAR_SELLERS.map((name, i) => ({
      slug: `seller-${i + 1}`,
      name,
      rating: round1(
        rng.weighted([
          [rng.float(3.4, 3.9), 1],
          [rng.float(4, 4.9), 5],
        ] as const),
      ),
      isOfficial: false,
    })),
  ];
  const regular = sellers.filter((s) => !s.isOfficial);
  const sellerBySlug = new Map(sellers.map((s) => [s.slug, s]));

  // ── Товары: модель × вариант × продавец ──
  const products: BuiltProduct[] = [];
  const usedSlugs = new Set<string>();
  const modelsOut = new Map<string, Built["models"][number]>();

  for (const category of Object.keys(OFFER_TARGETS)) {
    const variants = MODELS.filter((m) => m.category === category).flatMap(
      expandVariants,
    );
    const defs = defsByCategory.get(category) ?? [];
    const avg = (OFFER_TARGETS[category] ?? 0) / variants.length;

    for (const v of variants) {
      const { model } = v;
      const modelSlug = slugify(`${model.brand} ${model.name}`);
      modelsOut.set(modelSlug, {
        slug: modelSlug,
        brand: model.brand,
        name: model.name,
        categorySlug: category,
      });

      // Атрибуты варианта → строки product_attributes (с проверкой значений по спецификации).
      const baseAttrs: BuiltAttr[] = [];
      for (const def of defs) {
        const value = v.attrs[def.key];
        if (value === undefined) continue;
        if (def.type === "bool") baseAttrs.push({ key: def.key, num: value ? 1 : 0 });
        else if (def.type === "number")
          baseAttrs.push({ key: def.key, num: Number(value) });
        else
          for (const item of Array.isArray(value) ? value : [String(value)]) {
            labelOf(category, def.key, item);
            baseAttrs.push({ key: def.key, option: item });
          }
      }

      const color =
        typeof v.attrs.color === "string"
          ? colorLabel(v.attrs.color).toLowerCase()
          : null;
      const title = makeTitle(category, model, v, labelOf, color);
      const details = defs
        .filter((d) => d.layer === 3 || d.layer === 4)
        .flatMap((d) => {
          const value = v.attrs[d.key];
          if (value === undefined) return [];
          if (d.type === "bool") return [`${d.name}: ${value ? "да" : "нет"}`];
          if (d.type === "number")
            return [`${d.name}: ${value}${d.unit ? ` ${d.unit}` : ""}`];
          const items = (Array.isArray(value) ? value : [String(value)]).map((x) =>
            labelOf(category, d.key, x),
          );
          return items.length ? [`${d.name}: ${items.join(", ")}`] : [];
        });

      // Сколько предложений у варианта и какие продавцы.
      const n = clamp(Math.round(avg * rng.float(0.6, 1.4)), 1, 8);
      const official = sellerBySlug.get(`official-${slugify(model.brand)}`);
      const chosen = [
        ...(official && rng.chance(0.85) ? [official] : []),
        ...rng.sample(regular, n),
      ].slice(0, Math.max(n, 1));

      for (const seller of chosen) {
        const sellerMult = seller.isOfficial ? rng.float(1, 1.04) : rng.float(0.9, 1.06);
        const priceRub = Math.max(
          90,
          Math.round((model.base * v.mult * sellerMult) / 100) * 100 - 10,
        );
        const discount = rng.chance(0.45) ? rng.int(5, 35) : 0;
        const oldRub = discount
          ? Math.round(priceRub / (1 - discount / 100) / 10) * 10
          : null;

        const reviewsCount = Math.floor(10 ** rng.float(0.5, 3.4));
        const rating = clamp(
          round1(rng.float(3.5, 4.95) * 0.7 + seller.rating * 0.3),
          3,
          5,
        );
        const attrs = [...baseAttrs];
        const paymentsDef = defs.find((d) => d.key === "payments");
        if (paymentsDef && priceRub >= 5000) {
          if (rng.chance(0.7)) attrs.push({ key: "payments", option: "installment" });
          if (rng.chance(0.5)) attrs.push({ key: "payments", option: "split" });
        }

        let slug = slugify(
          `${modelSlug}-${Object.values(v.axisValues).join("-")}-${seller.slug}`,
        );
        for (let i = 2; usedSlugs.has(slug); i++)
          slug = `${slug.replace(/-\d+$/, "")}-${i}`;
        usedSlugs.add(slug);

        products.push({
          slug,
          title,
          description: `${title}. ${details.join("; ")}.`,
          categorySlug: category,
          brandSlug: slugify(model.brand),
          sellerSlug: seller.slug,
          price: priceRub * 100,
          oldPrice: oldRub ? oldRub * 100 : null,
          rating,
          reviewsCount,
          stock: rng.chance(0.05) ? 0 : rng.int(1, 300),
          deliveryDays: rng.weighted([
            [0, 15],
            [1, 30],
            [2, 25],
            [3, 15],
            [5, 10],
            [7, 5],
          ] as const),
          isOriginal: seller.isOfficial || rng.chance(0.92),
          popularity: Math.round(reviewsCount * rating + rng.int(0, 200)),
          images: [`/products/${modelSlug}.svg`],
          attrs,
        });
      }
    }
  }

  return {
    categories,
    brands,
    sellers,
    attrDefs,
    options,
    products,
    models: [...modelsOut.values()],
  };
}

function makeTitle(
  category: string,
  m: ModelSpec,
  v: Variant,
  labelOf: (category: string, key: string, value: string) => string,
  color: string | null,
): string {
  const head = `${m.brand} ${m.name}`;
  const a = v.attrs;
  switch (category) {
    case "smartphones":
      return `${head} ${a.ram}/${gbLabel(Number(a.storage))}, ${color}`;
    case "laptops":
      return `${head} ${a.ram} ГБ/${gbLabel(Number(a.storage))}, ${labelOf(category, "cpu", String(a.cpu))}, ${color}`;
    case "tvs":
      return `${head} ${v.axisValues.size}″ ${labelOf(category, "resolution", String(a.resolution))}`;
    case "tablets":
      return `${head} ${gbLabel(Number(a.storage))}, ${color}`;
    case "sneakers":
      return `${head}, ${labelOf(category, "gender", String(a.gender)).toLowerCase()}, ${color}`;
    case "backpacks":
      return `${head} ${v.axisValues.liters} л, ${color}`;
    case "toys":
      return head;
    default:
      return color ? `${head}, ${color}` : head;
  }
}

export function summarize(built: Built): Record<string, number> {
  const byCategory: Record<string, number> = {};
  for (const p of built.products)
    byCategory[p.categorySlug] = (byCategory[p.categorySlug] ?? 0) + 1;
  return { total: built.products.length, ...byCategory };
}
