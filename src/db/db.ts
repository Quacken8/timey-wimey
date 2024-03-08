import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { CheckerOutput, PromiseType } from "../types";
import { DBRowSelect, entries, parseForDB } from "./schema";
import dayjs from "dayjs";
import { between, and, inArray } from "drizzle-orm";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "path";
import * as vscode from "vscode";
import { minutesToString } from "../ui/parseToString";

export abstract class DB {
  constructor(context: vscode.ExtensionContext) {}

  abstract getFolderPath(): string;
  abstract getFilePath(): string;
  abstract insert(row: Promise<CheckerOutput>[]): Promise<void>;
  abstract getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]>;
  abstract getTodaysWork(): Promise<string>;
  abstract getWorkspaces(): Promise<string[]>;
  abstract doMigrate(pathToMigrations: string): void;
}

export class DefaultDB extends DB {
  #db: ReturnType<typeof drizzle>;
  #context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.#context = context;
    const migrationsFolder = path.join(
      context.extensionPath,
      ".drizzle/migrations"
    );
    this.doMigrate(migrationsFolder);
    const filePath = this.getFilePath();
    const betterSqlite = new Database(filePath);
    this.#db = drizzle(betterSqlite);
  }

  doMigrate(pathToMigrations: string) {
    const pathToDB = this.getFilePath();
    const betterSqlite = new Database(pathToDB);
    const db = drizzle(betterSqlite);
    migrate(db, { migrationsFolder: pathToMigrations });

    betterSqlite.close();
  }

  getFolderPath() {
    return vscode.Uri.joinPath(this.#context.globalStorageUri, "db").fsPath;
  }

  getFilePath() {
    return path.join(this.getFolderPath(), "db.sqlite"); // FIXME get this from settings?
  }

  async insert(row: Promise<CheckerOutput>[]) {
    const resolved = parseForDB(await Promise.all(row));
    if (resolved.working || resolved.window_focused)
      this.#db.insert(entries).values(resolved).run();
  }

  getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]> {
    if (workspaces !== undefined) {
      if (workspaces.length === 0) {
        return Promise.resolve([]);
      }
      return this.#db
        .select()
        .from(entries)
        .where(
          and(
            between(entries.timestamp, from.toDate(), to.toDate()),
            inArray(entries.workspace, workspaces)
          )
        );
    } else {
      return this.#db
        .select()
        .from(entries)
        .where(between(entries.timestamp, from.toDate(), to.toDate()));
    }
  }

  async getTodaysWork(): Promise<string> {
    const now = dayjs();
    const startOfToday = now.startOf("day");
    const selectResult = await this.getRows(startOfToday, now);
    const total = selectResult.reduce(
      (acc, row) => acc + (row.working ? row.interval_minutes : 0),
      0
    );

    return minutesToString(total);
  }

  async getWorkspaces() {
    return (
      await this.#db.selectDistinct({ repo: entries.workspace }).from(entries)
    ).map((row) => (row.repo === null ? "no workspace" : row.repo));
  }
}

export function getDB(context: vscode.ExtensionContext): DB {
  const userProvided = false;

  if (userProvided) {
    throw new Error("Not implemented");
  } else {
    return new DefaultDB(context);
  }
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
