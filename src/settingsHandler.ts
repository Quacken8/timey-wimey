// handle all the settings here? Maybe?

import { defaultCheckers } from "./checkers";
import { insertToDB, setUpDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";

export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const settings = vscode.workspace.getConfiguration("timeyboogaloo");
  const onSettingsChanged = () => {
    repeatingSaver.interval = settings.get<number>("interval")! * 60 * 1000;

    repeatingSaver.checkers = defaultCheckers.map((setup) => setup(context));

    const dbFile = settings.get<string>("moveDBOnFileChange")!;
    const moveOldDB = settings.get<boolean>("moveDBOnFileChange")!;
    // FIXME implement moving old db
    const db = setUpDB(dbFile);
    repeatingSaver.insertToDB = (row) => insertToDB(db, row);
  };

  onSettingsChanged();
  subscribe(
    vscode.workspace.onDidChangeConfiguration(onSettingsChanged),
    context
  );
}
