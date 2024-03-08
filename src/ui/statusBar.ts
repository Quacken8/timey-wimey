import * as vscode from "vscode";
import { subscribe } from "../utils";
import { StatusBarUpdater } from "../timer";
import { getDB } from "../db/db";
import { webviewCallback } from "./frontendMaker";

export const subscribeStatusBar = async (
  updater: StatusBarUpdater,
  context: vscode.ExtensionContext
) => {
  const db = getDB(context);
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = await db.getTodaysWork();
  statusBarItem.tooltip = "Today's working time";
  // statusBarItem.command = "timeyWimey.showStats";
  statusBarItem.command = "timeyWimey.openWebView";
  statusBarItem.show();

  subscribe(statusBarItem, context);
  updater.statusBarItem = statusBarItem;
  updater.getTodaysWorkFromDB = () => db.getTodaysWork();
  const started = await updater.startTimer();
  if (started !== "started") {
    console.error("StatusBarUpdater failed to start", started);
  }

  subscribe(
    vscode.commands.registerCommand("timeyWimey.openDB", () => {
      const filePath = vscode.Uri.file(db.getFilePath());
      vscode.commands.executeCommand("vscode.open", filePath);
    }),
    context
  );

  subscribe(
    vscode.commands.registerCommand("timeyWimey.openWebView", () =>
      webviewCallback(context)
    ),
    context
  );
};
