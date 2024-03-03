import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { CheckerOutput, PromiseType } from "../types";
import { DBRowSelect, entries, parseForDB } from "./schema";
import * as fs from "fs";
import dayjs from "dayjs";
import { between } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import * as vscode from "vscode";

export const doMigrate = (pathToDB: string, pathToMigrations: string) => {
  const betterSqlite = new Database(pathToDB);
  const db = drizzle(betterSqlite);
  migrate(db, { migrationsFolder: pathToMigrations });

  betterSqlite.close();
  console.log("closed");
};

export const getDBFolderPath = (context: vscode.ExtensionContext) =>
  path.join(context.extensionPath, "db");

export async function getDB(context: vscode.ExtensionContext) {
  const folderPath = getDBFolderPath(context);

  console.log(`DB folder path: ${folderPath}`);
  const dbFilename = "db.sqlite"; // FIXME get this from settings?
  const migrationsFolder = path.join(
    context.extensionPath,
    ".drizzle/migrations"
  );
  console.log("ensuring folder");
  await fs.promises.mkdir(folderPath, {
    recursive: true,
  });
  const filePath = path.join(folderPath, dbFilename);
  console.log("migrating");
  console.log(migrationsFolder);
  doMigrate(filePath, migrationsFolder);
  console.log("getting the db itself");
  const betterSqlite = new Database(filePath);
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

export async function getFromDB(
  db: PromiseType<ReturnType<typeof getDB>>,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs
): Promise<DBRowSelect[]> {
  const selectResult = db
    .select()
    .from(entries)
    .where(between(entries.timestamp, from.toDate(), to.toDate()));

  return selectResult;
}

export async function getTodaysWorkFromDB(
  db: PromiseType<ReturnType<typeof getDB>>
): Promise<string> {
  const now = dayjs();
  const startOfToday = now.startOf("day");
  const selectResult = await getFromDB(db, startOfToday, now);
  const total = selectResult.reduce(
    (acc, row) => acc + row.interval_minutes,
    0
  );

  return `${Math.floor(total / 60)}h ${(total % 60).toFixed(0)}m`;
}
