import { uuid } from "drizzle-orm/pg-core";

import { accounts } from "./identity";

/** Tenant scope FK — required on all personal-app domain tables. */
export const accountIdColumn = () =>
    uuid("account_id")
        .notNull()
        .references(() => accounts.id, { onDelete: "cascade" });
