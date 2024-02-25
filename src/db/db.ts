import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { CheckerOutput, PromiseType } from "../types";
import { entries, parseForDB } from "./schema";
import * as fs from "fs";

export async function getDB(filePath: string) {
  let betterSqlite;
  try {
    betterSqlite = new Database(filePath);
  } catch (err) {
    if (
      err instanceof TypeError &&
      err.message.includes("directory does not exist")
    ) {
      await fs.promises.mkdir(filePath, { recursive: true });
      betterSqlite = new Database(filePath);
    } else {
      throw err;
    }
  }
  const db = drizzle(betterSqlite);
  return db;
}

export const insertToDB = async (
  db: PromiseType<ReturnType<typeof getDB>>,
  row: Promise<CheckerOutput>[]
) => {
  const resolved = parseForDB(await Promise.all(row));
  const insertResult = db.insert(entries).values(resolved).run();
  console.log(insertResult);
};
