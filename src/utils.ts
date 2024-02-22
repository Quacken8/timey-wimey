import * as vscode from "vscode";
import * as fs from "fs";

export const subscribe = <T extends { dispose(): void }>(
  d: T,
  context: vscode.ExtensionContext
) => {
  context.subscriptions.push(d);
  return d;
};
