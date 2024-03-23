import * as vscode from "vscode";

export const subscribe = <T extends { dispose(): void }>(
  d: T,
  context: vscode.ExtensionContext
) => {
  context.subscriptions.push(d);
  return d;
};
