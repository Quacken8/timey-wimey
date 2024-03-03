// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { RepeatingSaver, StatusBarUpdater } from "./timer";
import { insertToDB } from "./db/db";
import { setTimerSettingsAndSubscribe } from "./settingsHandler";
import { subscribeStatusBar } from "./ui/statusBar";

const repeatingSaver = new RepeatingSaver();
const statusBarUpdater = new StatusBarUpdater();
export function activate(context: vscode.ExtensionContext) {
  console.log("Yo waddup");
  setTimerSettingsAndSubscribe(repeatingSaver, context);
  // set up toolbar ui updatators and such
  subscribeStatusBar(statusBarUpdater, context);
}

export function deactivate() {
  repeatingSaver.dispose();
}
