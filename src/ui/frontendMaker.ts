import * as vscode from "vscode";
import * as fs from "fs";
import { registerApiReplies } from "./backend";
import path from "path";

export const webviewCallback = async (context: vscode.ExtensionContext) => {
  const panel = vscode.window.createWebviewPanel(
    "Timey webview", // Identifies the type of the webview. Used internally
    "Timey Wimey", // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );

  registerApiReplies(panel, context);
  panel.webview.html = await getWebviewContent(context);
};

async function getWebviewContent(context: vscode.ExtensionContext) {
  const pathToHtml = vscode.Uri.file(
    path.join(context.extensionPath, "src", "ui", "frontend.html")
  );

  const pathUri = pathToHtml.with({ scheme: "vscode-resource" });
  const html = await fs.promises.readFile(pathUri.fsPath, "utf-8");
  return html;
}
