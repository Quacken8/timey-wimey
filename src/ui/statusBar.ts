import * as vscode from "vscode";
import { subscribe } from "../utils";
import { StatusBarUpdater } from "../timer";

export const subscribeStatusBar = (
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

  updater.statusBarItem = statusBarItem;
  const started = updater.startTimer();
  if (started !== "started") {
    console.error("StatusBarUpdater failed to start", started);
  }
};
