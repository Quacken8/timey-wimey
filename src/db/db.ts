import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { CheckerOutput, PromiseType } from "../types";
import { DBRowSelect, entries, parseForDB } from "./schema";
import * as fs from "fs";
import dayjs from "dayjs";
import { between, and, inArray } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import * as vscode from "vscode";
import { minutesToString } from "../ui/parseToString";

export type DB = PromiseType<ReturnType<typeof getDB>>;

export const doMigrate = (pathToDB: string, pathToMigrations: string) => {
  const betterSqlite = new Database(pathToDB);
  const db = drizzle(betterSqlite);
  migrate(db, { migrationsFolder: pathToMigrations });

  betterSqlite.close();
};

export const getDBFolderPath = (context: vscode.ExtensionContext) =>
  path.join(context.extensionPath, "db");

export const getDBFilePath = (context: vscode.ExtensionContext) =>
  path.join(getDBFolderPath(context), "db.sqlite"); // FIXME get this from settings?

export async function getDB(context: vscode.ExtensionContext) {
  const folderPath = getDBFolderPath(context);

  const migrationsFolder = path.join(
    context.extensionPath,
    ".drizzle/migrations"
  );
  await fs.promises.mkdir(folderPath, {
    recursive: true,
  });
  const filePath = getDBFilePath(context);
  doMigrate(filePath, migrationsFolder);
  const betterSqlite = new Database(filePath);
  const db = drizzle(betterSqlite);
  return db;
}

export const insertToDB = async (db: DB, row: Promise<CheckerOutput>[]) => {
  const resolved = parseForDB(await Promise.all(row));
  const insertResult = db.insert(entries).values(resolved).run();
};

export async function getFromDB(
  db: DB,
  from: dayjs.Dayjs,
  to: dayjs.Dayjs,
  workspaces?: string[]
): Promise<DBRowSelect[]> {
  if (workspaces !== undefined) {
    return db
      .select()
      .from(entries)
      .where(
        and(
          between(entries.timestamp, from.toDate(), to.toDate()),
          inArray(entries.workspace, workspaces)
        )
      );
  } else {
    return db
      .select()
      .from(entries)
      .where(between(entries.timestamp, from.toDate(), to.toDate()));
  }
}

export async function getTodaysWorkFromDB(db: DB): Promise<string> {
  const now = dayjs();
  const startOfToday = now.startOf("day");
  const selectResult = await getFromDB(db, startOfToday, now);
  const total = selectResult.reduce(
    (acc, row) => acc + (row.working ? row.interval_minutes : 0),
    0
  );

  return minutesToString(total);
}

export const reduceToPerRepo = (rows: DBRowSelect[]) =>
  rows.reduce((acc, row) => {
    const key = row.workspace ?? "no workspace";
    const workingMinutes = row.working ? row.interval_minutes : 0;
    if (acc[key]) {
      acc[key] += workingMinutes;
    } else {
      acc[key] = workingMinutes;
    }
    return acc;
  }, {} as Record<string, number>);

export async function getReposFromDB(db: DB) {
  return (
    await db.selectDistinct({ repo: entries.workspace }).from(entries)
  ).map((row) => row.repo);
}

// export function getDateRangeFromDB(db:DB): DateRange {

// }
