import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { envServer } from "@/lib/config/env.server";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | undefined;
let dbInstance: Db | undefined;

function getConnectionString(): string {
    const url = envServer.databaseUrl;
    if (!url) {
        throw new Error(
            "DATABASE_URL is not set. Configure Postgres connection for Drizzle.",
        );
    }
    return url;
}

function createDb(): Db {
    client = postgres(getConnectionString(), {
        prepare: false,
        max: 10,
    });
    return drizzle(client, { schema });
}

/**
 * Lazily initialized Drizzle client for server-side queries.
 * Uses transaction pooler — `prepare: false` is required for Supabase pooler.
 */
export function getDb(): Db {
    if (!dbInstance) {
        dbInstance = createDb();
    }
    return dbInstance;
}

/** Lazy alias — does not connect until first property access */
export const db: Db = new Proxy({} as Db, {
    get(_target, prop, receiver) {
        return Reflect.get(getDb(), prop, receiver);
    },
});
