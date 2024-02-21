import Database from "better-sqlite3";
import { CheckerOutput } from "../types";

//export const saveToDB = async (row: Promise<DBColumnEntry>[]) => {
//  let resolved = await Promise.all(row);
//  console.log(resolved);
//};

import { drizzle } from "drizzle-orm/better-sqlite3";
import { entries, parseForDB } from "./schema";

export function setUpDB(filePath: string) {
  const betterSqlite = new Database(filePath);
  const db = drizzle(betterSqlite);
  return db;
}

export const insertToDB = async (
  db: ReturnType<typeof setUpDB>,
  row: Promise<CheckerOutput>[]
) => {
  const resolved = parseForDB(await Promise.all(row));
  const insertResult = await db.insert(entries).values(resolved).execute();
};
