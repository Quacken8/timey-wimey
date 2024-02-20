import dayjs = require("dayjs");
import { DBEntry, IDatabase } from "./typesAndInterfaces";
import * as vscode from "vscode";

export const mockupEntries: DBEntry[] = Array.from({ length: 20 }, (_, i) => ({
  time: dayjs().subtract(i, "hour"),
  workType: i % 2 === 0 ? "writing" : "windowFocused",
  message: i % 3 === 0 ? "start" : i % 3 === 1 ? "working" : "stop",
}));

export function mockupDB(): IDatabase {
  return {
    writeToDB: (entry) => {
      vscode.window.showInformationMessage("writeToDB");
    },
    readFromDB: (range) => {
      vscode.window.showInformationMessage("readFromDB");
      return [
        {
          time: dayjs(),
          workType: "writing",
          message: "start",
        },
      ];
    },
    simplifyDB: () => {
      vscode.window.showInformationMessage("simplifyDB");
    },
    fixDB: () => {
      vscode.window.showInformationMessage("fixDB");
    },
  };
}
