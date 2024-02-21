import dayjs from "dayjs";
import * as vscode from "vscode";

export type CheckerOutput =
  | TimeEntry
  | WorkingEntry
  | WindowFocusEntry
  | WorkspaceEntry
  | OpenFileEntry
  | LastCommitEntry
  | CustomEntry;
export type Checker = () => Promise<CheckerOutput>;

export type CheckerSetuper = (context: vscode.ExtensionContext) => Checker;

export type TimeEntry = {
  key: "timestamp";
  value: dayjs.Dayjs;
};

export type WorkingEntry = {
  key: "working";
  value: boolean;
};

export type WindowFocusEntry = {
  key: "window_focused";
  value: boolean;
};

export type WorkspaceEntry = {
  key: "workspace";
  value: vscode.Uri | undefined;
};

export type OpenFileEntry = {
  key: "current_file";
  value: string | undefined;
};

export type LastCommitEntry = {
  key: "last_commit_hash";
  value: string | undefined;
};

export type CustomEntry = {
  key: "custom";
  value: JSON;
};
