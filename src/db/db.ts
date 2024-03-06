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

export interface DBInstance {
  getFolderPath(context: vscode.ExtensionContext): string;
  getFilePath(context: vscode.ExtensionContext): string;
  insert(row: Promise<CheckerOutput>[]): Promise<void>;
  getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]>;
  getTodaysWork(): Promise<string>;
  getWorkspaces(): Promise<string[]>;
  doMigrate(context: vscode.ExtensionContext, pathToMigrations: string): void;
}

export interface DBConstructor {
  create(context: vscode.ExtensionContext): Promise<DB>;
}

export interface DB extends DBInstance {
  create: DBConstructor;
}
export class DefaultDB implements DB {
  #db?: ReturnType<typeof drizzle>;

  static async create(context: vscode.ExtensionContext) {
    const instance = new DefaultDB();
    const folderPath = instance.getFolderPath(context);

    const migrationsFolder = path.join(
      context.extensionPath,
      ".drizzle/migrations"
    );
    await vscode.workspace.fs.createDirectory(vscode.Uri.parse(folderPath));
    instance.doMigrate(context, migrationsFolder);
    const filePath = instance.getFilePath(context);
    const betterSqlite = new Database(filePath);
    instance.#db = drizzle(betterSqlite);
    return instance;
  }

  doMigrate(context: vscode.ExtensionContext, pathToMigrations: string) {
    const pathToDB = this.getFilePath(context);
    const betterSqlite = new Database(pathToDB);
    const db = drizzle(betterSqlite);
    migrate(db, { migrationsFolder: pathToMigrations });

    betterSqlite.close();
  }

  getFolderPath(context: vscode.ExtensionContext) {
    return vscode.Uri.joinPath(context.globalStorageUri, "db").fsPath;
  }

  getFilePath(context: vscode.ExtensionContext) {
    return path.join(this.getFolderPath(context), "db.sqlite"); // FIXME get this from settings?
  }

  async insert(row: Promise<CheckerOutput>[]) {
    const resolved = parseForDB(await Promise.all(row));
    if (resolved.working || resolved.window_focused)
      this.#db!.insert(entries).values(resolved).run();
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
      return this.#db!.select()
        .from(entries)
        .where(
          and(
            between(entries.timestamp, from.toDate(), to.toDate()),
            inArray(entries.workspace, workspaces)
          )
        );
    } else {
      return this.#db!.select()
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
      await this.#db!.selectDistinct({ repo: entries.workspace }).from(entries)
    ).map((row) => (row.repo === null ? "no workspace" : row.repo));
  }
}

export async function getDB(context: vscode.ExtensionContext): Promise<DB> {
  const userProvided = false;

  if (userProvided) {
    throw new Error("Not implemented");
  } else {
    return DefaultDB.create(context);
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
