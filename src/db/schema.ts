import { match, P } from "ts-pattern";
import { CheckerOutput } from "../types";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { getTableColumns } from "drizzle-orm";

// FIXME implement name of db (possibly named after the user?)
export const entries = sqliteTable("entries", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  timestamp: integer("date", { mode: "timestamp" }).notNull(),
  interval_minutes: real("interval_minutes").notNull(),
  working: integer("working", { mode: "boolean" }).notNull(),
  window_focused: integer("window_focused", { mode: "boolean" }).notNull(),
  workspace: text("workspace"),
  current_file: text("current_file"),
  last_commit_hash: text("last_commit_hash"),
  custom: text("custom", { mode: "json" }),
});

export const tableCols = getTableColumns(entries);

export type DBRowInsert = Omit<typeof entries.$inferInsert, "id">;
export type DBRowSelect = typeof entries.$inferSelect;

export function parseForDB(row: CheckerOutput[]): DBRowInsert {
  let parsedRow: Partial<DBRowInsert> = {};
  for (const entry of row) {
    match(entry)
      .with({ key: "timestamp" }, (e) => {
        parsedRow.timestamp = e.value.toDate();
      })
      .with({ key: "workspace" }, (e) => {
        parsedRow.workspace = e.value?.toString();
      })
      .with({ key: "current_file" }, (e) => {
        parsedRow.current_file = e.value;
      })
      .with({ key: "last_commit_hash" }, (e) => {
        parsedRow.last_commit_hash = e.value;
      })
      .with({ key: "working" }, (e) => {
        parsedRow.working = e.value;
      })
      .with({ key: "window_focused" }, (e) => {
        parsedRow.window_focused = e.value;
      })
      .with({ key: "custom" }, (e) => {
        parsedRow.custom = JSON.stringify(e.value);
      })
      .with({ key: "interval_minutes" }, (e) => {
        parsedRow.interval_minutes = e.value;
      })
      .exhaustive();
  }

  if (
    Object.keys(tableCols).every(
      (key) => (key === "id") !== parsedRow.hasOwnProperty(key) // what a weird way to xor
    )
  ) {
    return parsedRow as DBRowInsert;
  }

  throw new Error("Trying to insert only partial row into database.");
}
