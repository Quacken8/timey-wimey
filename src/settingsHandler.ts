import { defaultCheckers } from "./checkers";
import { insertToDB, setUpDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import * as fs from "fs";
import path from "path";

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

    const dbFolder = settings.get<string>("databasePath")!;
    const dbName = "timey.db";
    let dbFile;
    try {
      dbFile = path.parse(path.join(dbFolder, dbName)).dir;
    } catch (err) {
      if (err instanceof TypeError) {
        // FIXME apply default
        vscode.window.showErrorMessage(
          `${dbFolder} is not a valid path. Using old path instead.`
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
