import * as vscode from "vscode";
import { subscribe } from "../utils";
import { StatusBarUpdater } from "../timer";
import {
  getDB,
  getFromDB,
  getTodaysWorkFromDB,
  reduceToPerRepo,
} from "../db/db";
import dayjs from "dayjs";
import { showInFile } from "./showInFile";
import { parseToString } from "./parseToString";

export const subscribeStatusBar = async (
  updater: StatusBarUpdater,
  context: vscode.ExtensionContext
) => {
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "0h 0m";
  statusBarItem.tooltip = "Today's working time";
  statusBarItem.command = "timeyWimey.showStats";
  statusBarItem.show();

  subscribe(statusBarItem, context);
  const db = await getDB(context);
  updater.statusBarItem = statusBarItem;
  updater.getTodaysWorkFromDB = () => getTodaysWorkFromDB(db);
  const started = await updater.startTimer();
  if (started !== "started") {
    console.error("StatusBarUpdater failed to start", started);
  }

  subscribe(
    vscode.commands.registerCommand(statusBarItem.command, async () => {
      const thisWeek = reduceToPerRepo(
        await getFromDB(db, dayjs().startOf("week"), dayjs())
      );
      const thisMonth = reduceToPerRepo(
        await getFromDB(db, dayjs().startOf("month"), dayjs())
      );
      const lastMonth = reduceToPerRepo(
        await getFromDB(
          db,
          dayjs().startOf("month").subtract(1, "month"),
          dayjs().startOf("month")
        )
      );
      showInFile(parseToString(thisWeek, thisMonth, lastMonth));
    }),
    context
  );
};
