import * as vscode from "vscode";
import { registerApiReplies } from "./backend";
import path from "path";

export const webviewCallback = async (context: vscode.ExtensionContext) => {
  const panel = vscode.window.createWebviewPanel(
    "Timey webview", // Identifies the type of the webview. Used internally
    "Timey Wimey", // Title of the panel displayed to the user
    vscode.ViewColumn.One, // Editor column to show the new webview panel in.
    { enableScripts: true } // Webview options. More on these later.
  );
  // panel.iconPath = {
  //   dark: vscode.Uri.joinPath(
  //     context.extensionUri,
  //     "assets",
  //     "clock-melting-white.svg"
  //   ),
  //   light: vscode.Uri.joinPath(
  //     context.extensionUri,
  //     "assets",
  //     "clock-melting.svg"
  //   ),
  // };

  registerApiReplies(panel, context);
  panel.webview.html = await getWebviewContent(context);
};

async function getWebviewContent(context: vscode.ExtensionContext) {
  const pathToHtml = vscode.Uri.file(
    path.join(context.extensionPath, "src", "ui", "index.html")
  );
  const html = new TextDecoder().decode(
    await vscode.workspace.fs.readFile(pathToHtml)
  );
  return html;
}
