import { Checker, CheckerSetuper } from "./types";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import { simpleGit, SimpleGit } from "simple-git";
import dayjs from "dayjs";

/** Checks current time */
export const timeChecherSetup: CheckerSetuper = () => {
  return async () => {
    return {
      key: "timestamp",
      value: dayjs(),
    };
  };
};

export type TimeEntry = {
  key: "timestamp";
  value: dayjs.Dayjs;
};

/** Sets up a checker that checks whether the user has worked in the last cycle */
export const workingCheckerSetup: CheckerSetuper = (context) => {
  let working: boolean = false;
  subscribe(
    vscode.workspace.onDidChangeTextDocument(async () => {
      working = true;
    }),
    context
  );

  return async () => {
    const wasWorking = working;
    working = false;
    return {
      key: "working",
      value: wasWorking,
    };
  };
};

/** Sets up a checker that checks whether the window is focused */
export const windowsFocusedCheckerSetup: CheckerSetuper = (context) => {
  let focused: boolean = false;
  subscribe(
    vscode.window.onDidChangeWindowState((event) => {
      focused = event.focused;
    }),
    context
  );
  return async () => {
    const wasFocused = focused;
    focused = false;
    return {
      key: "window_focused",
      value: wasFocused,
    };
  };
};

/** Checks what is the root of the current workspace */
export const worksapceCheckerSetup: CheckerSetuper = () => {
  return async () => {
    return {
      key: "workspace",
      value: vscode.workspace.workspaceFolders?.[0].uri,
    };
  };
};

/** Checks current open file */
export const openFileCheckerSetup: CheckerSetuper = () => {
  return async () => {
    return {
      key: "current_file",
      value: vscode.window.activeTextEditor?.document.fileName,
    };
  };
};

/** Checks hash of last commit */
export const lastCommitCheckerSetup: CheckerSetuper = () => {
  const git: SimpleGit = simpleGit();
  return async () => {
    const rootFile = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    let hash;
    try {
      hash = rootFile
        ? await git
            .log({ file: rootFile })
            .then((log) => log.latest?.hash ?? undefined)
        : undefined;
    } catch (e) {
      hash = undefined;
    }
    return {
      key: "last_commit_hash",
      value: hash,
    };
  };
};

export const defaultCheckers: CheckerSetuper[] = [
  timeChecherSetup,
  windowsFocusedCheckerSetup,
  workingCheckerSetup,
  worksapceCheckerSetup,
  openFileCheckerSetup,
  lastCommitCheckerSetup,
];
