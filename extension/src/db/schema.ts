import { match, P } from "ts-pattern";
import { CheckerOutput } from "../types";

export type DBRowInsert = {
  timestamp: number;
  interval_minutes: number;
  working: boolean;
  window_focused: boolean;
  workspace: string | null;
  current_file: string | null;
  last_commit_hash: string | null;
  custom: any;
};
export type DBRowSelect = {
  id: number;
  timestamp: Date;
  interval_minutes: number;
  working: boolean;
  window_focused: boolean;
  workspace: string | null;
  current_file: string | null;
  last_commit_hash: string | null;
  custom: any;
};
export const tableCols = [
  "id",
  "timestamp",
  "interval_minutes",
  "working",
  "window_focused",
  "workspace",
  "current_file",
  "last_commit_hash",
];

export function parseForDB(row: CheckerOutput[]): DBRowInsert {
  let parsedRow: Partial<DBRowInsert> = {};
  for (const entry of row) {
    match(entry)
      .with({ key: "timestamp" }, (e) => {
        parsedRow.timestamp = e.value.unix();
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
