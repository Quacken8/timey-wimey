import { getDB } from "./db/db";
import { webviewCallback } from "./ui/frontendMaker";
import { subscribe } from "./utils";
import * as vscode from "vscode";

export async function registerCommands(context: vscode.ExtensionContext) {
  const db = await getDB(context);

  subscribe(
    vscode.commands.registerCommand("timeyWimey.openDB", () => {
      const filePath = vscode.Uri.file(db.getFilePath());
      vscode.commands.executeCommand("vscode.open", filePath);
    }),
    context
  );

  subscribe(
    vscode.commands.registerCommand("timeyWimey.showStats", () =>
      webviewCallback(context)
    ),
    context
  );
}
