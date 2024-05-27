import dayjs from "dayjs";
import { CheckerOutput } from "../types";
import { DB } from "./db";
import { DBRowSelect } from "./schema";
import * as vscode from "vscode";
import path from "path";

export class WasmDB extends DB {
  #context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.#context = context;
  }

  getFolderPath(): string {
    return vscode.Uri.joinPath(
      vscode.Uri.parse(this.#context.extensionPath),
      "testDb"
    ).fsPath;
  }
  getFilePath(): string {
    return path.join(this.getFolderPath(), "db.sqlite");
  }
  insert(row: Promise<CheckerOutput>[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getRows(
    from: dayjs.Dayjs,
    to: dayjs.Dayjs,
    workspaces?: string[]
  ): Promise<DBRowSelect[]> {
    throw new Error("Method not implemented.");
  }
  getTodaysWork(): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getWorkspaces(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
}
