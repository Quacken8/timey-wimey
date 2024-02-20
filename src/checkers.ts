import { Checker, CheckerSetuper } from "./types";
import * as vscode from "vscode";
import { subscribe } from "./utils";
import { simpleGit, SimpleGit, CleanOptions } from "simple-git";

/** Sets up a checker that checks whether the user has worked in the last cycle */
export const workingCheckerSetup: CheckerSetuper = (context) => {
  let working: boolean = false;
  subscribe(
    vscode.workspace.onDidChangeTextDocument(async () => {
      working = true;
    }),
    context
  );

  return () => {
    const wasWorking = working;
    working = false;
    return {
      header: "Working",
      data: wasWorking,
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
  return () => {
    const wasFocused = focused;
    focused = false;
    return {
      header: "Focused",
      data: wasFocused,
    };
  };
};

export const workspaceChecker: Checker = () => {
  return {
    header: "Workspace",
    data:
      vscode.workspace.workspaceFolders?.[0].uri ??
      "No workspace, just staring blankly into the void, contemplating the life choices that led to this moment.",
  };
};

export const lastCommitCheckerSetup: CheckerSetuper = () => {
  const git: SimpleGit = simpleGit();
  return () => {
    const rootFile = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    return {
      header: "Last Commit Hash",
      data: rootFile
        ? git
            .log({ file: rootFile })
            .then((log) => log.latest?.hash ?? undefined)
        : undefined,
    };
  };
};

export const defaultCheckers: CheckerSetuper[] = [
  workingCheckerSetup,
  windowsFocusedCheckerSetup,
  lastCommitCheckerSetup,
];
