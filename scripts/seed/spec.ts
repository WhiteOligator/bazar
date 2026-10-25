// Описание каталога: дерево категорий, атрибуты (фильтры) и их значения.
// Слои фильтров по спецификации: 1 — условия сделки, 3 — главное о товаре,
// 4 — технические параметры, 5 — внешний вид. Слой 2 (бренд, продавец, рейтинг,
// оригинал) — это колонки товара, а не атрибуты.

export type OptionSpec = { value: string; label: string; hex?: string };

export type AttrSpec = {
  key: string;
  name: string;
  type: "enum" | "number" | "bool" | "color";
  layer: 1 | 3 | 4 | 5;
  unit?: string;
  isMulti?: boolean;
  options?: OptionSpec[];
};

export type CategorySpec = {
  slug: string;
  name: string;
  parent?: string;
  attrs?: AttrSpec[];
};

const gb = (...n: number[]): OptionSpec[] =>
  n.map((v) => ({ value: String(v), label: v >= 1024 ? `${v / 1024} ТБ` : `${v} ГБ` }));

const opts = (...pairs: [string, string][]): OptionSpec[] =>
  pairs.map(([value, label]) => ({ value, label }));

export const COLORS: OptionSpec[] = [
  { value: "black", label: "Чёрный", hex: "#1a1a1a" },
  { value: "white", label: "Белый", hex: "#f5f5f5" },
  { value: "blue", label: "Синий", hex: "#2b5fd9" },
  { value: "green", label: "Зелёный", hex: "#2e8b57" },
  { value: "red", label: "Красный", hex: "#d23c3c" },
  { value: "gold", label: "Золотой", hex: "#d4af37" },
  { value: "silver", label: "Серебристый", hex: "#c0c4c8" },
  { value: "gray", label: "Серый", hex: "#8a8f94" },
  { value: "purple", label: "Фиолетовый", hex: "#7b4fd4" },
  { value: "pink", label: "Розовый", hex: "#e87fa8" },
];

const color: AttrSpec = {
  key: "color",
  name: "Цвет",
  type: "color",
  layer: 5,
  options: COLORS,
};

const payments: AttrSpec = {
  key: "payments",
  name: "Оплата",
  type: "enum",
  layer: 1,
  isMulti: true,
  options: opts(["installment", "Рассрочка"], ["split", "Оплата частями"]),
};

const enumAttr = (
  key: string,
  name: string,
  layer: AttrSpec["layer"],
  options: OptionSpec[],
  isMulti = false,
): AttrSpec => ({ key, name, type: "enum", layer, options, isMulti });

export const CATEGORIES: CategorySpec[] = [
  { slug: "electronics", name: "Электроника" },
  { slug: "appliances", name: "Бытовая техника" },
  { slug: "fashion", name: "Одежда и обувь" },
  { slug: "kids", name: "Детям" },

  {
    slug: "smartphones",
    name: "Смартфоны",
    parent: "electronics",
    attrs: [
      enumAttr("storage", "Встроенная память", 3, gb(64, 128, 256, 512, 1024)),
      enumAttr("ram", "Оперативная память", 3, gb(4, 6, 8, 12, 16)),
      enumAttr(
        "screen",
        "Диагональ экрана",
        3,
        opts(["small", "до 6,3″"], ["mid", "6,3–6,6″"], ["large", "больше 6,6″"]),
      ),
      enumAttr(
        "battery",
        "Ёмкость аккумулятора",
        3,
        opts(
          ["low", "до 4000 мАч"],
          ["mid", "4000–5000 мАч"],
          ["high", "более 5000 мАч"],
        ),
      ),
      enumAttr(
        "interfaces",
        "Интерфейсы",
        4,
        opts(["nfc", "NFC"], ["5g", "5G"], ["esim", "eSIM"], ["wifi7", "Wi-Fi 7"]),
        true,
      ),
      enumAttr(
        "features",
        "Особенности",
        4,
        opts(
          ["wireless", "Беспроводная зарядка"],
          ["ip68", "Защита IP68"],
          ["fingerprint", "Сканер отпечатка"],
          ["stereo", "Стереодинамики"],
        ),
        true,
      ),
      color,
      payments,
    ],
  },
  {
    slug: "laptops",
    name: "Ноутбуки",
    parent: "electronics",
    attrs: [
      enumAttr("ram", "Оперативная память", 3, gb(8, 16, 32, 64)),
      enumAttr("storage", "Накопитель", 3, gb(256, 512, 1024, 2048)),
      enumAttr(
        "screen",
        "Диагональ экрана",
        3,
        opts(["small", "до 14″"], ["mid", "14–15,6″"], ["large", "16″ и больше"]),
      ),
      enumAttr(
        "cpu",
        "Процессор",
        4,
        opts(
          ["i5", "Intel Core i5"],
          ["i7", "Intel Core i7"],
          ["r5", "AMD Ryzen 5"],
          ["r7", "AMD Ryzen 7"],
          ["m", "Apple M-серии"],
        ),
      ),
      enumAttr(
        "gpu",
        "Видеокарта",
        4,
        opts(["integrated", "Встроенная"], ["discrete", "Дискретная"]),
      ),
      enumAttr(
        "os",
        "Операционная система",
        4,
        opts(["win", "Windows 11"], ["mac", "macOS"], ["none", "Без ОС"]),
      ),
      color,
      payments,
    ],
  },
  {
    slug: "headphones",
    name: "Наушники",
    parent: "electronics",
    attrs: [
      enumAttr(
        "kind",
        "Тип",
        3,
        opts(["inear", "Вкладыши"], ["onear", "Накладные"], ["over", "Полноразмерные"]),
      ),
      enumAttr(
        "connection",
        "Подключение",
        3,
        opts(["wireless", "Беспроводные"], ["wired", "Проводные"]),
      ),
      { key: "anc", name: "Шумоподавление", type: "bool", layer: 3 },
      { key: "battery", name: "Время работы", type: "number", layer: 4, unit: "ч" },
      { key: "mic", name: "Микрофон", type: "bool", layer: 4 },
      color,
      payments,
    ],
  },

  {
    slug: "tvs",
    name: "Телевизоры",
    parent: "electronics",
    attrs: [
      enumAttr(
        "diagonal",
        "Диагональ",
        3,
        opts(["s", "до 43″"], ["m", "50–55″"], ["l", "65″ и больше"]),
      ),
      enumAttr("resolution", "Разрешение", 3, opts(["fhd", "Full HD"], ["4k", "4K UHD"])),
      color,
    ],
  },
  {
    slug: "tablets",
    name: "Планшеты",
    parent: "electronics",
    attrs: [
      enumAttr("storage", "Встроенная память", 3, gb(64, 128, 256, 512)),
      enumAttr(
        "screen",
        "Диагональ экрана",
        3,
        opts(["s", "до 9″"], ["m", "10–11″"], ["l", "12″ и больше"]),
      ),
      color,
    ],
  },
  {
    slug: "vacuums",
    name: "Пылесосы",
    parent: "appliances",
    attrs: [
      enumAttr(
        "kind",
        "Тип",
        3,
        opts(["robot", "Робот"], ["cordless", "Вертикальный"], ["wired", "Проводной"]),
      ),
      color,
    ],
  },
  {
    slug: "coffee-machines",
    name: "Кофемашины",
    parent: "appliances",
    attrs: [
      enumAttr(
        "kind",
        "Тип",
        3,
        opts(
          ["auto", "Автоматическая"],
          ["capsule", "Капсульная"],
          ["manual", "Рожковая"],
        ),
      ),
      color,
    ],
  },
  {
    slug: "sneakers",
    name: "Кроссовки",
    parent: "fashion",
    attrs: [
      enumAttr("gender", "Пол", 3, opts(["m", "Мужские"], ["f", "Женские"])),
      color,
    ],
  },
  {
    slug: "backpacks",
    name: "Рюкзаки",
    parent: "fashion",
    attrs: [
      enumAttr(
        "volume",
        "Объём",
        3,
        opts(["s", "до 20 л"], ["m", "20–30 л"], ["l", "30 л и больше"]),
      ),
      color,
    ],
  },
  {
    slug: "toys",
    name: "Игрушки",
    parent: "kids",
    attrs: [
      enumAttr(
        "kind",
        "Тип",
        3,
        opts(
          ["constructor", "Конструкторы"],
          ["dolls", "Куклы"],
          ["cars", "Машинки"],
          ["boardgames", "Настольные игры"],
        ),
      ),
      enumAttr(
        "age",
        "Возраст",
        3,
        opts(["0", "0–3 года"], ["3", "3–6 лет"], ["6", "6–12 лет"]),
      ),
    ],
  },
];

/** Бренды, у которых есть «официальный продавец». */
export const OFFICIAL_BRANDS = [
  "Apple",
  "Samsung",
  "Xiaomi",
  "Sony",
  "Lenovo",
  "ASUS",
  "HP",
  "Huawei",
] as const;

export const REGULAR_SELLERS = [
  "ТехноМир",
  "Цифровой Квартал",
  "Гаджет Хаб",
  "МегаСтор",
  "Электрон",
  "ПроТех",
  "Маркет Плюс",
  "ТехноСфера",
  "Вектор",
  "Бытовик",
  "DigitalPoint",
  "ТопМаркет",
  "Айсберг",
  "Орбита",
  "ПремиумТех",
  "Смарт Базар",
  "Городок",
  "Лавка Гаджетов",
  "Нео Маркет",
  "Атлант",
  "Квант",
  "Домовой",
] as const;
