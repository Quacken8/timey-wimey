import * as vscode from "vscode";

export type DBColumnEntry = {
  header: string; // FIXME some id or header or something
  data: any;
};
export type Checker = () => DBColumnEntry;

export type CheckerSetuper = (context: vscode.ExtensionContext) => Checker;
