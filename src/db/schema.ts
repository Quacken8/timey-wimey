import {
  integer,
  pgEnum,
  pgTable,
  serial,
  uniqueIndex,
  varchar,
  date,
  text,
  json,
  boolean,
} from "drizzle-orm/pg-core";
import { match, P } from "ts-pattern";
import { CheckerOutput } from "../types";

export const entries = pgTable("entries", {
  id: serial("id").primaryKey(),
  timestamp: date("date").notNull(),
  working: boolean("working").notNull(),
  window_focused: boolean("window_focused").notNull(),
  workspace: text("workspace"),
  current_file: text("current_file"),
  last_commit_hash: text("last_commit_hash"),
  custom: json("custom"),
});

const dummyInsert = entries.$inferInsert;
export type DBRowInsert = Omit<typeof dummyInsert, "id">;

export function parseForDB(row: CheckerOutput[]): DBRowInsert {
  let parsedRow: Partial<DBRowInsert> = {};
  for (const entry of row) {
    match(entry)
      .with({ key: "timestamp" }, (e) => {
        parsedRow.timestamp = e.value.toISOString();
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
        parsedRow.custom = e.value;
      })
      .exhaustive();
  }

  if (
    Object.keys(dummyInsert).every(
      (key) => (key === "id") !== parsedRow.hasOwnProperty(key) // what a weird way to xor
    )
  ) {
    return parsedRow as DBRowInsert;
  }

  throw new Error("Trying to insert only partial row into database.");
}
