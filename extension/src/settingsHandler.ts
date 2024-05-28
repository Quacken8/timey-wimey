import { defaultCheckers } from "./checkers";
import { getDB } from "./db/db";
import { RepeatingSaver } from "./timer";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import { Checker } from "./types";

const developmentMode = process.env.NODE_ENV === "development";

export function getInterval() {
  if (developmentMode) return 1000 * 5;
  const settings = vscode.workspace.getConfiguration("timeyWimey");
  return settings.get<number>("writeInterval")! * 60 * 1000;
}

export function setTimerSettingsAndSubscribe(
  repeatingSaver: RepeatingSaver,
  context: vscode.ExtensionContext
) {
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

    const db = await getDB(context);
    repeatingSaver.insertToDB = (row) => db.insert(row);

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
