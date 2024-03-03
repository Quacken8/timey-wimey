import { defaultCheckers } from "./checkers";
import { insertToDB, getDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import * as fs from "fs";
import path from "path";
import { Checker, CheckerSetuper } from "./types";

let oldDbFilePath: string | undefined;
export function getDBFolderPath(context: vscode.ExtensionContext) {
  const dbFolder = path.join(context.extensionPath, "db");

  return dbFolder;
}
export function getInterval() {
  const settings = vscode.workspace.getConfiguration("timeyboogaloo");
  return (settings.get<number>("writeInterval")! * 60 * 1000) / 60; //FIXME for debug reasons
}

export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const settings = vscode.workspace.getConfiguration("timeyboogaloo");
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
    console.log(`DB folder path: ${dbFolderPath}`);
    const moveOldDB = settings.get<boolean>("moveDBOnFileChange")!;
    if (moveOldDB && oldDbFilePath && oldDbFilePath !== dbFolderPath) {
      await fs.promises.rename(oldDbFilePath, dbFolderPath);
    }
    const dbFilename = "db.sqlite"; // FIXME get this from settings
    const db = await getDB(
      dbFolderPath,
      dbFilename,
      path.join(context.extensionPath, ".drizzle/migrations")
    );
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
      if (e.affectsConfiguration("timeyboogaloo")) onSettingsChanged();
    }),
    context
  );
}
