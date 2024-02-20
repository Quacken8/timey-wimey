// handle all the settings here? Maybe?

import { defaultCheckers } from "./checkers";
import { saveToDB } from "./db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";

export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const onSettingsChanged = () => {
    const interval = 1000;
    repeatingSaver.interval = interval;
    repeatingSaver.checkers = defaultCheckers.map((setup) => setup(context));
  };
  onSettingsChanged();
  subscribe(
    vscode.workspace.onDidChangeConfiguration(onSettingsChanged),
    context
  );
}
