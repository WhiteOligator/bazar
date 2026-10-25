import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Деньги хранятся в копейках (integer). Показ — через formatPrice (позже, в shared/lib).

/** Дерево категорий. `path` — материализованный путь из slug: "electronics/smartphones". */
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    parentId: integer("parent_id").references((): AnyPgColumn => categories.id),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    depth: smallint("depth").notNull(),
    sort: smallint("sort").notNull().default(0),
  },
  (t) => [
    index("categories_parent_idx").on(t.parentId),
    // Префиксный поиск «вся ветка»: path LIKE 'electronics/%'.
    index("categories_path_idx").on(t.path.op("text_pattern_ops")),
  ],
);

export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
});

export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  rating: real("rating").notNull(),
  isOfficial: boolean("is_official").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Товар = предложение продавца (модель + вариант + продавец). */
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    brandId: integer("brand_id")
      .notNull()
      .references(() => brands.id),
    sellerId: integer("seller_id")
      .notNull()
      .references(() => sellers.id),
    /** Цена в копейках. */
    price: integer("price").notNull(),
    /** Старая цена в копейках; null — скидки нет. */
    oldPrice: integer("old_price"),
    rating: real("rating").notNull(),
    reviewsCount: integer("reviews_count").notNull().default(0),
    stock: integer("stock").notNull().default(0),
    /** Срок доставки в днях: 0 — сегодня. */
    deliveryDays: smallint("delivery_days").notNull(),
    isOriginal: boolean("is_original").notNull().default(true),
    popularity: integer("popularity").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("products_category_price_idx").on(t.categoryId, t.price),
    index("products_category_popularity_idx").on(t.categoryId, t.popularity),
    index("products_brand_idx").on(t.brandId),
    index("products_seller_idx").on(t.sellerId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    sort: smallint("sort").notNull().default(0),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

/** enum — значение из списка, number — число (поле num_value), bool — 0/1 в num_value, color — enum с hex. */
export const attributeType = pgEnum("attribute_type", [
  "enum",
  "number",
  "bool",
  "color",
]);

/** Какие фильтры есть у категории. `layer` — слой фильтра по спецификации (1–5). */
export const attributeDefs = pgTable(
  "attribute_defs",
  {
    id: serial("id").primaryKey(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id),
    key: text("key").notNull(),
    name: text("name").notNull(),
    type: attributeType("type").notNull(),
    unit: text("unit"),
    /** Допускает несколько значений у одного товара (интерфейсы, особенности). */
    isMulti: boolean("is_multi").notNull().default(false),
    layer: smallint("layer").notNull(),
    sort: smallint("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("attribute_defs_category_key_idx").on(t.categoryId, t.key)],
);

export const attributeOptions = pgTable(
  "attribute_options",
  {
    id: serial("id").primaryKey(),
    attrId: integer("attr_id")
      .notNull()
      .references(() => attributeDefs.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    label: text("label").notNull(),
    /** Только для type = color. */
    hex: text("hex"),
    sort: smallint("sort").notNull().default(0),
  },
  (t) => [uniqueIndex("attribute_options_attr_value_idx").on(t.attrId, t.value)],
);

/** Значения атрибутов у товаров: option_id для enum/color, num_value для number/bool. */
export const productAttributes = pgTable(
  "product_attributes",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    attrId: integer("attr_id")
      .notNull()
      .references(() => attributeDefs.id, { onDelete: "cascade" }),
    optionId: integer("option_id").references(() => attributeOptions.id, {
      onDelete: "cascade",
    }),
    numValue: real("num_value"),
  },
  (t) => [
    // Фасеты: «сколько товаров у значения» и фильтр по значению.
    index("product_attributes_facet_idx").on(t.attrId, t.optionId, t.productId),
    index("product_attributes_num_idx").on(t.attrId, t.numValue),
    index("product_attributes_product_idx").on(t.productId),
  ],
);
