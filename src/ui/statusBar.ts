import * as vscode from "vscode";
import { subscribe } from "../utils";
import { StatusBarUpdater } from "../timer";
import { getDB, getTodaysWorkFromDB } from "../db/db";
import path from "path";

export const subscribeStatusBar = async (
  updater: StatusBarUpdater,
  context: vscode.ExtensionContext
) => {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "0h 0m";
  statusBarItem.tooltip = "Today's working time";
  //statusBarItem.command = "timeyBoogaloo.showTimey"; // FIXME add the frontend
  statusBarItem.show();

  subscribe(statusBarItem, context);
  const db = await getDB(context);
  updater.statusBarItem = statusBarItem;
  updater.getTodaysWorkFromDB = () => getTodaysWorkFromDB(db);
  const started = await updater.startTimer();
  if (started !== "started") {
    console.error("StatusBarUpdater failed to start", started);
  }
};
