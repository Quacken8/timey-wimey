import * as vscode from "vscode";
import { RepeatingSaver, StatusBarUpdater } from "./timer";
import { setTimerSettingsAndSubscribe } from "./settingsHandler";
import { subscribeStatusBar } from "./ui/statusBar";
import { registerCommands } from "./commands";

const repeatingSaver = new RepeatingSaver();
const statusBarUpdater = new StatusBarUpdater();
export async function activate(context: vscode.ExtensionContext) {
  setTimerSettingsAndSubscribe(repeatingSaver, context);
  registerCommands(context);
  await subscribeStatusBar(statusBarUpdater, context);
}

export function deactivate() {
  repeatingSaver.dispose();
}
