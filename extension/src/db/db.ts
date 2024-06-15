import { CheckerOutput } from "../types";
import {
  type DBRowSelect,
  migrationQuery,
  parseForDB,
  tableCols,
} from "./schema";
import dayjs from "dayjs";
import * as vscode from "vscode";
import { minutesToString } from "../ui/parseForUI";
import { dateSetLength } from "../ui/dateSetLength";
import { spawn, execSync } from "child_process";
import { getPeriodOfRange } from "../ui/histogramBinner";

export async function getDB(context: vscode.ExtensionContext): Promise<DB> {
  const sqliteInvoker =
    vscode.workspace.getConfiguration("timeyWimey").get<string>("dbCommand") ??
    "sqlite3";
  return new DB(context, sqliteInvoker);
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
const stdOutColSeparator = "]:]]:]]::";
const stdOutRowSeparator = "[:[[:[[::";

function executeSQLiteCommand({
  sqliteInvoker,
  dbFileUri,
  sqliteCommands,
  query,
}: {
  sqliteInvoker: string;
  dbFileUri: string;
  sqliteCommands: string[];
  query: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    const sqlite3 = spawn(sqliteInvoker, [
      ...sqliteCommands.flatMap((c) => [`-cmd`, `${c}`]),
      `${vscode.Uri.parse(dbFileUri).fsPath.replace(/^file:\/\//, "")}`,
      `${query}`,
    ]);

    let stdout = "";
    let stderr = "";

    sqlite3.stdout.on("data", (data) => {
      stdout += data;
    });

    sqlite3.stderr.on("data", (data) => {
      stderr += data;
    });

    sqlite3.on("close", (code) => {
      if (code !== 0 || stderr) {
        reject(new Error(`Sqlite error ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

/** DB that actually uses the sqlite3 that is availible on the machine
 */
class DB {
  #context: vscode.ExtensionContext;
  #sqliteInvoker: string;
  constructor(context: vscode.ExtensionContext, sqliteInvoker: string) {
    // check sqlite is here
    if (sqliteInvoker === "sqlite3") {
      try {
        execSync("sqlite3 --version");
      } catch (err) {
        vscode.window.showErrorMessage(
          "Timey: sqlite3 command not availible on the machine! You can install it here: https://www.sqlite.org/download.html. Don't forget to put it in PATH availble to vscode"
        );
        throw new Error(
          "sqlite3 command not availible on the machine! You can install it here: https://www.sqlite.org/download.html. Don't forget to put it in PATH"
        );
      }
    }
    this.doMigrate();
    this.#sqliteInvoker = sqliteInvoker;
    this.#context = context;
  }
  async getWorkspaces() {
    const rawOut = await executeSQLiteCommand({
      sqliteInvoker: this.#sqliteInvoker,
      dbFileUri: this.getFilePath(),
      sqliteCommands: [
        `.separator '${stdOutColSeparator}' '${stdOutRowSeparator}'`,
      ],
      query:
        "SELECT workspace FROM entries GROUP BY workspace ORDER BY MAX(date) DESC;",
    });
    const res = rawOut
      .split(stdOutRowSeparator)
      .slice(0, -1)
      .map((row) =>
        row.split(stdOutColSeparator)[0] === ""
          ? "no workspace"
          : row.split(stdOutColSeparator)[0]
      );
    return res;
  }

  getFolderPath() {
    return vscode.Uri.joinPath(
      this.#context.globalStorageUri,
      "db"
    ).fsPath.replace(/^file:\/\//, "");
  }

  getFilePath() {
    return vscode.Uri.joinPath(
      vscode.Uri.parse(this.getFolderPath()),
      "db.sqlite"
    ).fsPath.replace(/^file:\/\//, "");
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
    const period = getPeriodOfRange(from, to);
    from = from.endOf(period);
    let rawOut;
    const sqliteCommands = [
      `.separator '${stdOutColSeparator}' '${stdOutRowSeparator}'`,
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
        sqliteInvoker: this.#sqliteInvoker,
        dbFileUri: this.getFilePath(),
        sqliteCommands,
        query,
      });
    } else {
      const query = "SELECT * FROM entries WHERE date BETWEEN :from AND :to";
      rawOut = await executeSQLiteCommand({
        sqliteInvoker: this.#sqliteInvoker,
        dbFileUri: this.getFilePath(),
        sqliteCommands,
        query,
      });
    }
    const possiblyNull: (x: string) => null | string = (x: string) =>
      x === "" ? null : x;
    if (rawOut === "") return [];
    const res = rawOut
      .split(stdOutRowSeparator)
      .slice(0, -1)
      .map((row) => {
        const s = row.split(stdOutColSeparator);
        return {
          id: Number(s[0]),
          date: new Date(Number(s[1]) * 1000),
          interval_minutes: Number(s[2]),
          working: Boolean(Number(s[3])),
          window_focused: Boolean(Number(s[4])),
          workspace: s[5],
          current_file: possiblyNull(s[6]),
          last_commit_hash: possiblyNull(s[7]),
          custom: possiblyNull(s[8]),
        };
      });
    return res;
  }

  async insert(row: Promise<CheckerOutput>[]) {
    const resolved = parseForDB(await Promise.all(row));
    const colsWithoutId = tableCols.filter((c) => c !== "id") as Exclude<
      (typeof tableCols)[number],
      "id"
    >[];
    const sqliteCommands = [".parameter init"];
    sqliteCommands.push(
      ...colsWithoutId.map(
        (c) =>
          `.parameter set :${c} ${
            resolved[c] === undefined ? `NULL` : `'${resolved[c]}'`
          }`
      )
    );
    const query = `INSERT INTO entries (${colsWithoutId.join(
      ", "
    )}) VALUES (${colsWithoutId.map((c) => `:${c}`).join(", ")})`;

    return await executeSQLiteCommand({
      sqliteInvoker: this.#sqliteInvoker,
      dbFileUri: this.getFilePath(),
      sqliteCommands,
      query,
    });
  }

  public async getLineCount({
    workspace,
    date,
  }: {
    workspace: string | undefined;
    date: dayjs.Dayjs | undefined;
  }): Promise<number> {
    let query = "SELECT COUNT(*) FROM entries";
    const conditions = [];
    const sqliteCommands = [];

    if (workspace !== undefined) {
      conditions.push("workspace = :workspace");
      const name =
        workspace === "no workspace" ? "NULL" : `'${escape(workspace)}'`;
      sqliteCommands.push(`.parameter set :workspace ${name}`);
    }

    if (date !== undefined) {
      conditions.push("date < :timestamp");
      sqliteCommands.push(`.parameter set :timestamp '${date.unix()}`);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
      sqliteCommands.unshift(".parameter init");
    }

    return Number(
      await executeSQLiteCommand({
        sqliteInvoker: this.#sqliteInvoker,
        dbFileUri: this.getFilePath(),
        sqliteCommands,
        query,
      })
    );
  }

  public async deleteRows(
    arg:
      | {
          workspace: string;
        }
      | {
          date: dayjs.Dayjs;
        }
  ) {
    let query = "DELETE FROM entries";
    const sqliteCommands = [".parameter init"];
    if ("workspace" in arg) {
      query += " WHERE workspace = :workspace";
      sqliteCommands.push(`.parameter set :workspace ${escape(arg.workspace)}`);
    } else {
      query += " WHERE date < :date";
      sqliteCommands.push(`.parameter set :date ${arg.date.unix()}`);
    }

    return await executeSQLiteCommand({
      sqliteInvoker: this.#sqliteInvoker,
      dbFileUri: this.getFilePath(),
      sqliteCommands,
      query,
    });
  }

  async doMigrate() {
    await vscode.workspace.fs.createDirectory(
      vscode.Uri.parse(this.getFolderPath())
    );
    const query = migrationQuery;
    await executeSQLiteCommand({
      sqliteInvoker: this.#sqliteInvoker,
      dbFileUri: this.getFilePath(),
      sqliteCommands: [],
      query,
    });
  }
}
