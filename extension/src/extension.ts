import * as vscode from "vscode";
import { RepeatingSaver, StatusBarUpdater } from "./timer";
import { setTimerSettingsAndSubscribe } from "./settingsHandler";
import { subscribeStatusBar } from "./ui/statusBar";
import { debugLog } from "./debugLogger";

const repeatingSaver = new RepeatingSaver();
const statusBarUpdater = new StatusBarUpdater();
export async function activate(context: vscode.ExtensionContext) {
  debugLog("extension is in development mode");
  setTimerSettingsAndSubscribe(repeatingSaver, context);
  await subscribeStatusBar(statusBarUpdater, context);
}

export function deactivate() {
  repeatingSaver.dispose();
}
