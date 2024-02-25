import { defaultCheckers } from "./checkers";
import { insertToDB, getDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import * as fs from "fs";
import path from "path";
import { Checker, CheckerSetuper } from "./types";

let oldDbFile: string | undefined;
export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
  const settings = vscode.workspace.getConfiguration("timeyboogaloo");
  const onSettingsChanged = async () => {
    repeatingSaver.interval =
      (settings.get<number>("writeInterval")! * 60 * 1000) / 60; //FIXME for debug reasons

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

    const dbFolder = settings.get<string>("databasePath")!;
    // FIXME implement name of db (possibly named after the user?)
    const dbName = "timey.db";
    let dbFile;
    try {
      path.parse(dbFolder);
      dbFile = path.join(dbFolder, dbName);
    } catch (err) {
      if (err instanceof TypeError) {
        // FIXME apply default
        vscode.window.showErrorMessage(
          `${dbFolder} is not a valid folder path. Using old path instead.`
        );
        throw err;
      } else {
        throw err;
      }
    }
    const moveOldDB = settings.get<boolean>("moveDBOnFileChange")!;
    if (moveOldDB && oldDbFile && oldDbFile !== dbFile) {
      await fs.promises.rename(oldDbFile, dbFile);
    }
    console.log(dbFile);
    const db = await getDB(dbFile);
    oldDbFile = dbFile;
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
