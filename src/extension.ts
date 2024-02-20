// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { RepeatingSaver } from "./timer";
import { defaultCheckers } from "./checkers";
import { DBColumnEntry } from "./types";
import { saveToDB } from "./db";
import { setTimerSettingsAndSubscribe } from "./settingsHandler";

const repeatingSaver = new RepeatingSaver();

export function activate(context: vscode.ExtensionContext) {
  // set up db
  repeatingSaver.saveToDB = saveToDB;

  setTimerSettingsAndSubscribe(repeatingSaver, context);

  // set up toolbar ui updatators and such
}

export function deactivate() {
  repeatingSaver.dispose();
}
