import { CheckerOutput } from "../types";
import { DBRowSelect } from "./schema";
import dayjs from "dayjs";
import path from "path";
import * as vscode from "vscode";
import { minutesToString } from "../ui/parseForUI";
import { dateSetLength } from "../ui/dateSetLength";
import { exec, execSync } from "child_process";
import { promisify } from "util";
const promisedExec = promisify(exec);

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
}

/// used when variable "NODE_ENV" is "development"
/// all queries are logged to console and no actual database is used
export class DebuggingDB {
  #context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.#context = context;
  }

  getFolderPath() {
    return vscode.Uri.joinPath(this.#context.globalStorageUri, "db").fsPath;
  }

  getFilePath() {
    return path.join(this.getFolderPath(), "db.sqlite");
  }

  async insert(row: Promise<CheckerOutput>[]) {
    console.log("Inserting");
    (await Promise.all(row)).map((r) => console.log(`${r.key}: \t ${r.value}`));
  }

  getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]> {
    console.log("Selecting from", from, "to", to, "for", workspaces);
    return Promise.resolve([]);
  }

  async getTodaysWork(): Promise<string> {
    console.log("Getting todays work");
    return "0m";
  }

  async getWorkspaces() {
    console.log("Getting workspaces");
    return ["no workspace"];
  }
}

export function getDB(context: vscode.ExtensionContext): DB {
  if (process.env.NODE_ENV === "development") {
    return new DebuggingDB(context);
  }
  return new NativeDB(context);
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

function escape(s: string): string {
  const dangerChars = ["'", "\n", ";"];
  return [...s].map((ch) => (ch in dangerChars ? `\\${ch}` : ch)).join("");
}

/// just something so fucked up it's likely it won't appear in any filename
const stdOutSeparator = "][Đđ[đ";
async function executeSQLiteCommand({
  dbFileUri,
  sqliteCommands,
  query,
}: {
  dbFileUri: string;
  sqliteCommands: string[];
  query: string;
}): Promise<string> {
  const raw = await promisedExec(
    `sqlite3 ${sqliteCommands
      .map((c) => `-cmd \"${c}\"`)
      .join(" ")} \"${dbFileUri}\" \"${query}\"`
  );
  if (raw.stderr) throw new Error("Sqlite error");
  return raw.stdout;
}

/** DB that actually uses the sqlite3 that is availible on the machine
 */
class NativeDB extends DB {
  #context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    // check sqlite is here
    try {
      execSync("sqlite3 --version");
    } catch (err) {
      throw new Error(
        "sqlite3 command not availible on the machine! You can install it here: https://www.sqlite.org/download.html. Don't forget to put it in PATH"
      );
    }

    super(context);
    this.#context = context;
  }
  async getWorkspaces() {
    const rawOut = await executeSQLiteCommand({
      dbFileUri: this.getFilePath(),
      sqliteCommands: [],
      query:
        "SELECT workspace FROM entries GROUP BY workspace ORDER BY MAX(date) DESC;",
    });
    const res = rawOut
      .split("\n")
      .map((row) =>
        row.split(stdOutSeparator)[0] === ""
          ? "no workspace"
          : row.split(stdOutSeparator)[0]
      );
    return res;
  }

  getFolderPath() {
    return vscode.Uri.joinPath(this.#context.globalStorageUri, "db").fsPath;
  }

  getFilePath() {
    return path.join(this.getFolderPath(), "db.sqlite");
  }
  async getTodaysWork(): Promise<string> {
    const now = dayjs();
    const startOfToday = now.startOf("day");
    const intervals = (await this.getRows(startOfToday, now)).filter(
      (row) => row.working || row.window_focused
    );

    const total = dateSetLength(intervals);

    return minutesToString(total);
  }

  async getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]> {
    let rawOut;
    const sqliteCommands = [
      `.separator '${stdOutSeparator}'`,
      `.parameter init`,
      `.parameter set :from '${from.unix()}'`,
      `.parameter set :to '${to.unix()}'`,
    ];
    if (workspaces !== undefined) {
      if (workspaces.length === 0) {
        return Promise.resolve([]);
      }
      sqliteCommands.push(
        ...workspaces.map((workspace, i) => {
          const name =
            workspace === "no workspace" ? "NULL" : `'${escape(workspace)}'`;
          return `.parameter set :workspace${i} ${name}`;
        })
      );
      const query = `SELECT * FROM entries WHERE date BETWEEN :from AND :to AND workspace IN (${Array.from(
        { length: workspaces.length },
        (_, i) => `:workspace${i}`
      ).join(",")})`;
      rawOut = await executeSQLiteCommand({
        dbFileUri: this.getFilePath(),
        sqliteCommands,
        query,
      });
    } else {
      const query = "SELECT * FROM entries WHERE date BETWEEN :from AND :to";
      rawOut = await executeSQLiteCommand({
        dbFileUri: this.getFilePath(),
        sqliteCommands,
        query,
      });
    }
    const possiblyNull: (x: string) => null | string = (x: string) =>
      x === "" ? null : x;
    if (rawOut === "") return [];
    return rawOut.split("\n").map((row) => {
      const s = row.split(stdOutSeparator);
      return {
        id: Number(s[0]),
        timestamp: new Date(Number(s[1]) * 1000),
        interval_minutes: Number(s[2]),
        working: Boolean(Number(s[3])),
        window_focused: Boolean(Number(s[4])),
        workspace: s[5],
        current_file: possiblyNull(s[6]),
        last_commit_hash: possiblyNull(s[7]),
        custom: possiblyNull(s[8]),
      };
    });
  }

  async insert() {
    console.log("no we dont");
  }

  doMigrate(pathToMigrations: string) {
    console.log("no we dont");
    // vscode.workspace.fs.createDirectory(vscode.Uri.file(this.getFolderPath()));
    // const pathToDB = this.getFilePath();
    // const betterSqlite = new Database(pathToDB);
    // const db = drizzle(betterSqlite);
    // migrate(db, { migrationsFolder: pathToMigrations });
    //
    // betterSqlite.close();
  }
}
