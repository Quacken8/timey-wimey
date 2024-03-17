import * as vscode from "vscode";
import { RepeatingSaver, StatusBarUpdater } from "./timer";
import { setTimerSettingsAndSubscribe } from "./settingsHandler";
import { subscribeStatusBar } from "./ui/statusBar";

const repeatingSaver = new RepeatingSaver();
const statusBarUpdater = new StatusBarUpdater();
export async function activate(context: vscode.ExtensionContext) {
  if (process.env.NODE_ENV === "development") {
    console.log("Extension is in development mode");
  }
  setTimerSettingsAndSubscribe(repeatingSaver, context);
  await subscribeStatusBar(statusBarUpdater, context);
}

export function deactivate() {
  repeatingSaver.dispose();
}
