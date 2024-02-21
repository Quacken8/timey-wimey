// handle all the settings here? Maybe?

import { defaultCheckers } from "./checkers";
import { insertToDB, setUpDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import * as fs from "fs";

let oldDbFile: string | undefined;
export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const settings = vscode.workspace.getConfiguration("timeyboogaloo");
  const onSettingsChanged = async () => {
    repeatingSaver.interval = settings.get<number>("interval")! * 60 * 1000;

    repeatingSaver.checkers = defaultCheckers.map((setup) => setup(context));
    // FIXME implement custom checker; also do we want the user to deselect default checkers?

    const dbFile = settings.get<string>("databasePath")!;
    const moveOldDB = settings.get<boolean>("moveDBOnFileChange")!;
    if (moveOldDB && oldDbFile && oldDbFile !== dbFile) {
      await fs.promises.rename(oldDbFile, dbFile);
    }
    const db = setUpDB(dbFile);
    oldDbFile = dbFile;
    repeatingSaver.insertToDB = (row) => insertToDB(db, row);

    const weGoin = repeatingSaver.startTimer();
    if (weGoin !== "started") {
      throw new Error(`Missing ${weGoin.missing} from the timer`);
    }
  };

  onSettingsChanged();
  subscribe(
    vscode.workspace.onDidChangeConfiguration(onSettingsChanged),
    context
  );
}
