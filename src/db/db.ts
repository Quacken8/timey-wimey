import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { CheckerOutput } from "../types";
import { entries, parseForDB } from "./schema";
import * as fs from "fs";

export function setUpDB(filePath: string) {
  let betterSqlite;
  try {
    betterSqlite = new Database(filePath);
  } catch (err) {
    if (
      err instanceof TypeError &&
      err.message.includes("directory does not exist")
    ) {
      fs.promises.mkdir(filePath, { recursive: true });
      betterSqlite = new Database(filePath);
    } else {
      throw err;
    }
  }
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
