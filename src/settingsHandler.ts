import { defaultCheckers } from "./checkers";
import { insertToDB, getDB, getDBFolderPath } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import * as fs from "fs";
import { Checker } from "./types";

let oldDbFilePath: string | undefined;

export function getInterval() {
  const settings = vscode.workspace.getConfiguration("timeyWimey");
  return settings.get<number>("writeInterval")! * 60 * 1000;
}

export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const settings = vscode.workspace.getConfiguration("timeyWimey");
  const onSettingsChanged = async () => {
    repeatingSaver.interval = getInterval();

    // FIXME implement custom checker; also do we want the user to deselect default checkers?
    const customChecker: Checker = async () => {
      return {
        key: "custom",
        value: {
          imJustAFool: "hell ye",
          nombre: 4,
        },
      };
    };
    repeatingSaver.checkers = [
      ...defaultCheckers.map((setup) => setup(context)),
      customChecker,
    ];

    const dbFolderPath = getDBFolderPath(context);
    const moveOldDB = settings.get<boolean>("moveDBOnFileChange")!;
    if (moveOldDB && oldDbFilePath && oldDbFilePath !== dbFolderPath) {
      await fs.promises.rename(oldDbFilePath, dbFolderPath);
    }

    const db = await getDB(context);
    oldDbFilePath = dbFolderPath;
    repeatingSaver.insertToDB = (row) => insertToDB(db, row);

    const weGoin = repeatingSaver.startTimer();
    if (weGoin !== "started") {
      throw new Error(`Missing ${weGoin.missing} from the timer`);
    }
  };

  onSettingsChanged();
  subscribe(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("timeyWimey")) onSettingsChanged();
    }),
    context
  );
}
