import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { env } from "@/shared/config/env";

import * as schema from "./schema";

// neon-http: один HTTP-запрос на запрос к базе — подходит серверным компонентам.
// Для атомарных операций (заказ + позиции) используем db.batch([...]).
export const db = drizzle({ client: neon(env.DATABASE_URL), schema });

export type Db = typeof db;
export * from "./schema";
